
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { SimpleGroupService } from '@/services/simpleGroupService';
import { showUniqueToast } from '@/utils/toastUtils';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useSimpleGroupManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['userGroups', user?.id],
    queryFn: async (): Promise<Group[]> => {
      if (!user) {
        console.log('⚠️ Pas d\'utilisateur connecté');
        return [];
      }
      console.log('🔄 Récupération des groupes pour:', user.id);
      const groups = await SimpleGroupService.getUserGroups(user.id);
      console.log('📊 Groupes récupérés:', groups.length);
      return groups;
    },
    enabled: !!user,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const getUserLocation = async (): Promise<LocationData | null> => {
    if (userLocation) return userLocation;

    try {
      const location = await GeolocationService.getCurrentLocation();
      setUserLocation(location);
      showUniqueToast(
        `Position: ${location.locationName}`,
        "📍 Position détectée"
      );
      return location;
    } catch (error) {
      showUniqueToast(
        'Géolocalisation indisponible - mode universel activé.',
        "📍 Géolocalisation indisponible"
      );
      return null;
    }
  };

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (userGroups.length > 0 && user) {
        try {
          const activeGroup = userGroups[0];
          console.log('👥 Récupération des membres pour le groupe:', activeGroup.id);
          
          const members = await SimpleGroupService.getGroupMembers(activeGroup.id);
          console.log('✅ Membres récupérés:', members.length);
          
          setGroupMembers(members);
          
          await SimpleGroupService.updateUserActivity(activeGroup.id, user.id);
        } catch (error) {
          console.error('❌ Erreur fetchGroupMembers:', error);
          setGroupMembers([]);
        }
      } else {
        console.log('ℹ️ Aucun groupe actif, reset des membres');
        setGroupMembers([]);
      }
    };

    fetchGroupMembers();
  }, [userGroups.length, user?.id]);

  const joinRandomGroup = async (): Promise<boolean> => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) return false;

    setLoading(true);
    
    try {
      console.log('🎲 Début du processus de recherche/création de groupe');
      
      const isAuth = await SimpleGroupService.verifyAuth();
      if (!isAuth) {
        toast({ 
          title: 'Session expirée', 
          description: 'Veuillez vous reconnecter.', 
          variant: 'destructive' 
        });
        return false;
      }

      const location = await getUserLocation();
      if (!location) {
        toast({ 
          title: 'Géolocalisation requise', 
          description: 'Votre position est nécessaire pour rejoindre un groupe.', 
          variant: 'destructive' 
        });
        return false;
      }

      console.log('📍 Position obtenue:', location.locationName);

      const nearbyGroups = await SimpleGroupService.findNearbyGroups(location);
      console.log('🔍 Groupes trouvés à proximité:', nearbyGroups.length);
      
      if (nearbyGroups.length > 0) {
        const targetGroup = nearbyGroups[0];
        console.log('👥 Tentative de rejoindre le groupe:', targetGroup.id);
        const success = await SimpleGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          console.log('✅ Groupe rejoint avec succès');
          toast({ 
            title: '✅ Groupe rejoint', 
            description: `Vous avez rejoint un groupe dans votre zone.`, 
          });
          await refetchGroups();
        }
        return success;
      } else {
        console.log('🆕 Aucun groupe trouvé, création d\'un nouveau groupe');
        const success = await SimpleGroupService.createGroup(location, user.id);
        
        if (success) {
          console.log('✅ Nouveau groupe créé avec succès');
          await refetchGroups();
        }
        return success;
      }
    } catch (error) {
      console.error('❌ Erreur joinRandomGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de rejoindre un groupe pour le moment.', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) return;

    setLoading(true);
    try {
      console.log('🚪 Tentative de quitter le groupe:', groupId);
      
      setGroupMembers([]);
      queryClient.setQueryData(['userGroups', user.id], []);

      const success = await SimpleGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        console.log('✅ Groupe quitté avec succès');
        toast({ 
          title: '✅ Groupe quitté', 
          description: 'Vous avez quitté le groupe avec succès.' 
        });
        await refetchGroups();
      }
    } catch (error) {
      console.error('❌ Erreur leaveGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Erreur lors de la sortie du groupe.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const currentGroup = userGroups[0];
  const connectedMembers = groupMembers.filter(m => m.isConnected);
  
  console.log('📊 STATS TEMPS RÉEL:');
  console.log('  - Groupe actif:', !!currentGroup);
  console.log('  - Membres API:', groupMembers.length);
  console.log('  - Connectés:', connectedMembers.length);
  if (currentGroup) {
    console.log('  - DB participants:', currentGroup.current_participants);
    console.log('  - Max participants:', currentGroup.max_participants);
  }

  return {
    userGroups,
    groupMembers,
    loading: loading || groupsLoading,
    userLocation,
    joinRandomGroup,
    leaveGroup,
    refetchGroups
  };
};
