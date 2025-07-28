import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedGroupService } from '@/services/enhancedGroupService';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { useActivityHeartbeat } from './useActivityHeartbeat';
import { toast } from './use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

/**
 * Hook principal pour la gestion des groupes avec logique anti-zombies
 * 
 * Intègre toutes les améliorations du plan :
 * - Définition stricte des groupes actifs
 * - Filtrage par âge
 * - Nettoyage en temps réel
 * - Priorité création vs rejoint
 */
export const useEnhancedGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  // Initialiser le service au premier chargement
  useEffect(() => {
    EnhancedGroupService.initialize();
  }, []);

  // Récupération des groupes avec filtrage strict
  const {
    data: userGroups = [],
    isLoading: groupsLoading,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ['enhancedUserGroups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await EnhancedGroupService.getUserActiveGroups(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL, // 30 secondes
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME, // 15 secondes
  });

  // Récupération des membres du premier groupe actif
  const activeGroup = userGroups?.[0];
  const {
    data: groupMembers = [],
    isLoading: membersLoading,
  } = useQuery({
    queryKey: ['enhancedGroupMembers', activeGroup?.id],
    queryFn: async () => {
      if (!activeGroup?.id) return [];
      return await EnhancedGroupService.getGroupActiveMembers(activeGroup.id);
    },
    enabled: !!activeGroup?.id,
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL, // 30 secondes
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME, // 15 secondes
  });

  // Battement de cœur d'activité pour le groupe actif
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroup?.id || null,
    enabled: !!activeGroup?.id && !!user?.id,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL
  });

  // Récupération de la géolocalisation
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await GeolocationService.getCurrentLocation();
        setUserLocation(location);
        
        if (location) {
          toast({
            title: '📍 Position détectée',
            description: `Recherche dans ${location.locationName}`,
          });
        }
      } catch (error) {
        console.warn('Géolocalisation non disponible:', error);
        toast({
          title: 'Géolocalisation indisponible',
          description: 'Certaines fonctionnalités peuvent être limitées.',
          variant: 'destructive',
        });
      }
    };

    if (user) {
      getUserLocation();
    }
  }, [user]);

  // Fonction pour rejoindre un groupe aléatoire
  const joinRandomGroup = async (): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Vous devez être connecté pour rejoindre un groupe.',
        variant: 'destructive',
      });
      return false;
    }

    const success = await EnhancedGroupService.joinRandomGroup(
      user,
      userLocation,
      loading,
      setLoading
    );

    if (success) {
      // Invalider et refetch les données
      queryClient.invalidateQueries({ queryKey: ['enhancedUserGroups'] });
      setTimeout(() => {
        refetchGroups();
      }, 1000);
    }

    return success;
  };

  // Fonction pour quitter un groupe
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user) return;

    const clearUserGroupsState = () => {
      queryClient.setQueryData(['enhancedUserGroups', user.id], []);
      queryClient.setQueryData(['enhancedGroupMembers', groupId], []);
    };

    await EnhancedGroupService.leaveGroup(
      groupId,
      user,
      loading,
      setLoading,
      clearUserGroupsState
    );

    // Invalider et refetch les données
    queryClient.invalidateQueries({ queryKey: ['enhancedUserGroups'] });
    queryClient.invalidateQueries({ queryKey: ['enhancedGroupMembers'] });
    
    setTimeout(() => {
      refetchGroups();
    }, 1000);
  };

  // Fonction pour refetch manuel
  const refetchData = async (): Promise<void> => {
    await refetchGroups();
    queryClient.invalidateQueries({ queryKey: ['enhancedGroupMembers'] });
  };

  return {
    // Données
    userGroups,
    groupMembers,
    userLocation,
    activeGroupId: activeGroup?.id || '',
    
    // États de chargement
    loading: groupsLoading || membersLoading || loading,
    isHeartbeatActive,
    
    // Actions
    joinRandomGroup,
    leaveGroup,
    refetchGroups: refetchData,
    
    // Stats pour debugging
    stats: {
      activeGroupsCount: userGroups.length,
      activeMembersCount: groupMembers.length,
      heartbeatActive: isHeartbeatActive,
      hasLocation: !!userLocation,
      locationName: userLocation?.locationName || 'Non détectée',
    },
  };
};

export default useEnhancedGroups;