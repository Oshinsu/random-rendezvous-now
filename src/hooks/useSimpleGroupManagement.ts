
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { UnifiedGroupRetrievalService } from '@/services/unifiedGroupRetrieval';
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

  // Unified group retrieval without automatic cleaning
  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['unifiedUserGroups', user?.id],
    queryFn: async (): Promise<Group[]> => {
      if (!user) return [];
      
      console.log('📋 [SIMPLE] Récupération UNIFIÉE des groupes pour:', user.id);
      
      try {
        // Use unified service without any cleaning
        const participations = await UnifiedGroupRetrievalService.getUserParticipations(user.id);
        const groups = UnifiedGroupRetrievalService.extractValidGroups(participations);
        
        // Update user activity for the first group (to stay "active")
        if (groups.length > 0) {
          await UnifiedGroupRetrievalService.updateUserActivity(groups[0].id, user.id);
          
          // Get members for the first group
          const members = await UnifiedGroupRetrievalService.getGroupMembers(groups[0].id);
          setGroupMembers(members);
        } else {
          setGroupMembers([]);
        }

        console.log('✅ [SIMPLE] Groupes récupérés via service unifié:', groups.length);
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
    refetchGroups
  };
};
