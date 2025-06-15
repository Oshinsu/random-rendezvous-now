
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
      if (!user) return [];
      return SimpleGroupService.getUserGroups(user.id);
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

  // Simplifier drastiquement la récupération des membres - pas d'effet complexe
  useEffect(() => {
    if (userGroups.length > 0 && user) {
      const fetchMembers = async () => {
        try {
          console.log('👥 Récupération des membres du groupe:', userGroups[0].id);
          const members = await SimpleGroupService.getGroupMembers(userGroups[0].id);
          setGroupMembers(members);
          
          // Mise à jour de l'activité utilisateur
          await SimpleGroupService.updateUserActivity(userGroups[0].id, user.id);
        } catch (error) {
          console.error('❌ Erreur fetchGroupMembers:', error);
          setGroupMembers([]);
        }
      };
      
      fetchMembers();
    } else {
      setGroupMembers([]);
    }
  }, [userGroups.length, user?.id]); // Dépendances simplifiées pour éviter la boucle

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

      // Chercher des groupes à proximité
      const nearbyGroups = await SimpleGroupService.findNearbyGroups(location);
      
      if (nearbyGroups.length > 0) {
        // Rejoindre le premier groupe disponible
        const targetGroup = nearbyGroups[0];
        const success = await SimpleGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          toast({ 
            title: '✅ Groupe rejoint', 
            description: `Vous avez rejoint un groupe dans votre zone.`, 
          });
          await refetchGroups();
        }
        return success;
      } else {
        // Créer un nouveau groupe
        const success = await SimpleGroupService.createGroup(location, user.id);
        
        if (success) {
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
      setGroupMembers([]);
      queryClient.setQueryData(['userGroups', user.id], []);

      const success = await SimpleGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
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
