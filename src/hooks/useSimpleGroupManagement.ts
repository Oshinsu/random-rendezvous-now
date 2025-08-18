
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { UnifiedGroupRetrievalService } from '@/services/unifiedGroupRetrieval';
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { toast } from '@/hooks/use-toast';
import { showUniqueToast } from '@/utils/toastUtils';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useSimpleGroupManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Unified group retrieval with improved filtering
  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['unifiedUserGroups', user?.id],
    queryFn: async (): Promise<Group[]> => {
      if (!user) return [];
      
      console.log('📋 [SIMPLE] Récupération UNIFIÉE avec nouveau filtrage pour:', user.id);
      
      try {
        // 1. Retrieve ALL participations (no DB-level filtering)
        const allParticipations = await UnifiedGroupRetrievalService.getUserParticipations(user.id);
        console.log('📋 [SIMPLE] Participations récupérées (total):', allParticipations.length);
        
        // 2. Apply client-side filtering for active participations
        const activeParticipations = UnifiedGroupRetrievalService.filterActiveParticipations(allParticipations);
        console.log('📋 [SIMPLE] Participations actives après filtrage:', activeParticipations.length);
        
        // 3. Extract valid groups
        const groups = UnifiedGroupRetrievalService.extractValidGroups(activeParticipations);
        
        // 4. Update user activity and get members for the first group
        if (groups.length > 0) {
          const firstGroup = groups[0];
          console.log('🎯 [SIMPLE] Groupe principal trouvé:', firstGroup.id);
          
          // Update activity immediately
          await UnifiedGroupRetrievalService.updateUserActivity(firstGroup.id, user.id);
          
          // Get members for the first group
          const members = await UnifiedGroupRetrievalService.getGroupMembers(firstGroup.id);
          setGroupMembers(members);
        } else {
          console.log('📋 [SIMPLE] Aucun groupe actif trouvé');
          setGroupMembers([]);
        }

        console.log('✅ [SIMPLE] Groupes finaux avec nouveau système:', groups.length);
        return groups;
      } catch (error) {
        console.error('❌ [SIMPLE] Erreur récupération groupes:', error);
        setGroupMembers([]);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL, // Optimized: 2 minutes
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME, // Optimized: 90 seconds
  });

  // Activity heartbeat - activate when user has an active group
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL // Optimized: 10 minutes
  });

  console.log('💓 [SIMPLE] Heartbeat status:', { 
    activeGroupId, 
    isHeartbeatActive, 
    hasGroups: userGroups.length > 0 
  });

  // Géolocalisation avec cache intelligent (comme l'ancien useSimpleGroups)
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    if (userLocation && !forceRefresh) return userLocation;

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

  // Initialisation géolocalisation
  useEffect(() => {
    if (user && !userLocation) {
      getUserLocation().catch(() => {
        console.log('Géolocalisation non disponible au démarrage');
      });
    }
  }, [user]);

  const joinRandomGroup = async (): Promise<boolean> => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) return false;

    setLoading(true);
    try {
      // Vérification auth comme dans l'ancien système
      const { UnifiedGroupService } = await import('@/services/unifiedGroupService');
      const isAuth = await UnifiedGroupService.verifyAuth();
      if (!isAuth) {
        toast({ 
          title: 'Session expirée', 
          description: 'Veuillez vous reconnecter.', 
          variant: 'destructive' 
        });
        return false;
      }

      // Obtenir la position avec le système de cache robuste
      const location = await getUserLocation();
      if (!location) {
        toast({ 
          title: 'Géolocalisation requise', 
          description: 'Votre position est nécessaire.', 
          variant: 'destructive' 
        });
        return false;
      }

      // Import service géolocalisation
      const { GroupGeolocationService } = await import('@/services/groupGeolocation');
      
      console.log('🔍 Recherche de groupe compatible...');
      
      // First, try to find a compatible existing group
      const compatibleGroup = await GroupGeolocationService.findCompatibleGroup(location);
      
      if (compatibleGroup) {
        console.log('✅ Groupe compatible trouvé, tentative de rejoindre:', compatibleGroup.id);
        
        // Try to join the existing group
        const joinSuccess = await UnifiedGroupService.joinGroup(compatibleGroup.id, user.id, location);
        
        if (joinSuccess) {
          console.log('✅ Rejoint avec succès le groupe:', compatibleGroup.id);
          toast({ 
            title: 'Groupe trouvé !', 
            description: 'Vous avez rejoint un groupe existant.', 
          });
          await refetchGroups();
          return true;
        } else {
          console.log('❌ Échec pour rejoindre le groupe, création d\'un nouveau...');
        }
      } else {
        console.log('📍 Aucun groupe compatible trouvé, création d\'un nouveau...');
      }
      
      // If no compatible group found or failed to join, create a new one
      const success = await UnifiedGroupService.createSimpleGroup(location, user.id);
      
      if (success) {
        console.log('✅ Nouveau groupe créé avec succès');
        toast({ 
          title: 'Nouveau groupe créé !', 
          description: 'En attente d\'autres participants...', 
        });
        await refetchGroups();
      }
      
      return success;
    } catch (error) {
      console.error('❌ Erreur joinRandomGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de rejoindre ou créer un groupe pour le moment.', 
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
      console.log('🚪 [SIMPLE] Quitter le groupe:', groupId);
      
      // Nettoyer l'état local immédiatement
      setGroupMembers([]);
      
      // Supprimer la participation
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erreur quitter groupe:', error);
        throw error;
      }

      toast({
        title: '✅ Groupe quitté',
        description: 'Vous avez quitté le groupe avec succès.'
      });

      // Invalider le cache et rafraîchir
      queryClient.invalidateQueries({ queryKey: ['unifiedUserGroups'] });
      await refetchGroups();
    } catch (error) {
      console.error('❌ Erreur leaveGroup:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de quitter le groupe.',
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
    refetchGroups,
    // Debug info
    isHeartbeatActive,
    activeGroupId
  };
};
