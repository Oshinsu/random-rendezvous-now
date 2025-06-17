
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { UnifiedGroupRetrievalService } from '@/services/unifiedGroupRetrieval';
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { toast } from '@/hooks/use-toast';
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
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL,
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME,
  });

  // Activity heartbeat - activate when user has an active group
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: 30000 // 30 seconds
  });

  console.log('💓 [SIMPLE] Heartbeat status:', { 
    activeGroupId, 
    isHeartbeatActive, 
    hasGroups: userGroups.length > 0 
  });

  // Géolocalisation
  useEffect(() => {
    if (user && !userLocation) {
      GeolocationService.getCurrentLocation()
        .then(setUserLocation)
        .catch(() => console.log('Géolocalisation non disponible'));
    }
  }, [user, userLocation]);

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
    leaveGroup,
    refetchGroups,
    // Debug info
    isHeartbeatActive,
    activeGroupId
  };
};
