import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { useActivityHeartbeat } from './useActivityHeartbeat';
import { toast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
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
    // Service initialization not needed for UnifiedGroupService
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
      const participations = await UnifiedGroupService.getUserParticipations(user.id);
      return participations.map(p => p.groups).filter(Boolean);
    },
    enabled: !!user?.id,
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL, // Optimized: 2 minutes
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME, // Optimized: 90 seconds
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
      return await UnifiedGroupService.getGroupMembers(activeGroup.id);
    },
    enabled: !!activeGroup?.id,
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL, // Optimized: 2 minutes
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME, // Optimized: 90 seconds
  });

  // Battement de cœur d'activité pour le groupe actif
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroup?.id || null,
    enabled: !!activeGroup?.id && !!user?.id,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL
  });

  // SUPPRESSION: Géolocalisation automatique retirée
  // La géolocalisation ne se déclenche plus automatiquement
  // Elle sera demandée seulement au clic sur "Rejoindre un groupe"

  // Fonction pour rejoindre un groupe aléatoire
  const joinRandomGroup = async (): Promise<boolean> => {
    // Vérification d'authentification renforcée
    if (!user) {
      toast({
        title: 'Authentification requise',
        description: 'Vous devez être connecté pour rejoindre un groupe.',
        variant: 'destructive',
      });
      return false;
    }

    // Double vérification: tester auth.uid() côté Supabase
    try {
      const { data: authTest, error: authError } = await supabase.from('profiles').select('id').limit(1);
      if (authError && authError.message.includes('JWT')) {
        console.error('❌ Session JWT corrompue détectée:', authError);
        toast({
          title: '🔒 Session expirée',
          description: 'Veuillez vous reconnecter pour continuer.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur de vérification auth:', error);
      toast({
        title: '🔒 Problème d\'authentification',
        description: 'Session corrompue. Reconnexion requise.',
        variant: 'destructive',
      });
      return false;
    }

    // Géolocalisation OBLIGATOIRE au clic
    toast({
      title: '🧭 Localisation en cours...',
      description: 'Détection de votre position pour créer le groupe',
    });

    try {
      const locationToUse = await GeolocationService.getCurrentLocation();
      setUserLocation(locationToUse);
      
      toast({
        title: '📍 Position détectée',
        description: `Création du groupe à ${locationToUse.locationName}`,
      });

      // Create a new group instead of joining random
      const newGroup = await UnifiedGroupService.createGroup(locationToUse, user.id);
      const success = !!newGroup;

      if (success) {
        // Invalider les données (refetch automatique)
        queryClient.invalidateQueries({ queryKey: ['enhancedUserGroups'] });
      }

      return success;
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
      toast({
        title: '❌ Géolocalisation échouée',
        description: 'Impossible de détecter votre position. Réessayez.',
        variant: 'destructive'
      });
      setLoading(false); // CRITIQUE pour débloquer l'UI
      return false;
    }
  };

  // Fonction pour quitter un groupe
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user) return;

    const clearUserGroupsState = () => {
      queryClient.setQueryData(['enhancedUserGroups', user.id], []);
      queryClient.setQueryData(['enhancedGroupMembers', groupId], []);
    };

    await UnifiedGroupService.leaveGroup(groupId, user.id);

    // Invalider les données (refetch automatique)
    queryClient.invalidateQueries({ queryKey: ['enhancedUserGroups'] });
    queryClient.invalidateQueries({ queryKey: ['enhancedGroupMembers'] });
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