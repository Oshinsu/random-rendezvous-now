import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from '@/services/groupGeolocation';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { supabase } from '@/integrations/supabase/client';
// Nettoyage géré automatiquement par cleanup-groups edge function
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { ErrorHandler } from '@/utils/errorHandling';
import { showUniqueToast } from '@/utils/toastUtils';

import { CoordinateValidator } from '@/utils/coordinateValidation';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useUnifiedGroups = () => {
  const { user } = useAuth();
  const { trackGroupCreate, trackGroupJoin } = useAnalytics();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  const isGettingLocation = useRef(false);
  const locationPromise = useRef<Promise<LocationData> | null>(null);
  const lastLocationTime = useRef<number>(0);

  // Cache de localisation simplifié
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    const now = Date.now();
    const locationCacheTime = 15 * 60 * 1000; // 15 minutes
    
    if (!forceRefresh && userLocation && (now - lastLocationTime.current) < locationCacheTime) {
      return userLocation;
    }

    if (isGettingLocation.current && locationPromise.current) {
      return locationPromise.current;
    }

    isGettingLocation.current = true;
    locationPromise.current = GeolocationService.getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
        lastLocationTime.current = now;
        showUniqueToast(
          `Position détectée: ${location.locationName}`,
          "📍 Position actualisée"
        );
        return location;
      })
      .catch((error) => {
        ErrorHandler.logError('GEOLOCATION', error);
        showUniqueToast(
          'Géolocalisation indisponible - mode universel activé.',
          "📍 Géolocalisation indisponible"
        );
        return null;
      })
      .finally(() => {
        isGettingLocation.current = false;
        locationPromise.current = null;
      });

    return locationPromise.current;
  };

  // Récupération simplifiée des groupes
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) return [];

    try {
      const allParticipations = await UnifiedGroupService.getUserParticipations(user.id);
      const validGroups = allParticipations.map(p => p.groups).filter(Boolean);

      if (validGroups.length > 0) {
        await UnifiedGroupService.updateUserLastSeen(validGroups[0].id, user.id);
        const members = await UnifiedGroupService.getGroupMembers(validGroups[0].id);
        setGroupMembers(members);
      } else {
        setGroupMembers([]);
      }

      return validGroups;
    } catch (error) {
      ErrorHandler.logError('UNIFIED_FETCH_USER_GROUPS', error);
      return [];
    }
  };

  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['unifiedUserGroups', user?.id],
    queryFn: fetchUserGroups,
    enabled: !!user,
    refetchInterval: false, // ✅ REALTIME PUR: Pas de polling, tout est géré par Realtime
    staleTime: 30 * 1000, // ✅ REALTIME PUR: Cache de 30 secondes seulement
    refetchOnMount: 'always',
    refetchOnWindowFocus: true, // ✅ REALTIME PUR: Rafraîchir au retour sur l'app
  });

  // Battement de cœur simplifié - 1 heure (aligné avec GROUP_CONSTANTS.HEARTBEAT_INTERVAL)
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL // ✅ Utilise la constante (1h)
  });

  // ✅ REALTIME: Souscription aux changements de groupe ET participants
  useEffect(() => {
    if (!activeGroupId || !user) return;

    console.log('🔄 [REALTIME] Souscription au groupe:', activeGroupId);

    // Canal unique pour écouter à la fois groups et group_participants
    const channel = supabase
      .channel(`group-updates-${activeGroupId}`)
      // Écouter les changements sur la table groups
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${activeGroupId}`,
        },
        (payload) => {
          console.log('🔄 [REALTIME] Groupe modifié:', payload);
          // Refetch immédiat pour mettre à jour l'UI
          refetchGroups();
        }
      )
      // Écouter les changements sur la table group_participants
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_participants',
          filter: `group_id=eq.${activeGroupId}`,
        },
        async (payload) => {
          console.log('🔄 [REALTIME] Participant modifié:', payload);
          
          // Refetch les membres immédiatement
          try {
            const members = await UnifiedGroupService.getGroupMembers(activeGroupId);
            setGroupMembers(members);
            
            // ✅ REALTIME PUR: Mise à jour instantanée du cache React Query
            queryClient.setQueryData(['unifiedUserGroups', user.id], (oldData: Group[] | undefined) => {
              if (!oldData || oldData.length === 0) return oldData;
              
              // Mettre à jour current_participants du groupe actif avec le nombre réel
              return oldData.map(group => 
                group.id === activeGroupId 
                  ? { ...group, current_participants: members.length }
                  : group
              );
            });
            
            // Refetch en arrière-plan (sans bloquer l'UI)
            refetchGroups();
            
            // Animation visuelle si c'est une insertion (nouveau membre)
            if (payload.eventType === 'INSERT') {
              window.dispatchEvent(new CustomEvent('group:member-joined'));
              showUniqueToast(
                'Un nouveau membre a rejoint le groupe !',
                '✨ Nouveau membre'
              );
            }
          } catch (error) {
            console.error('Erreur lors du refetch des membres:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [REALTIME] Désinscription du groupe:', activeGroupId);
      supabase.removeChannel(channel);
    };
  }, [activeGroupId, user]);

  // Fonction de création de groupe avec rate limiting
  const joinRandomGroup = async (): Promise<boolean> => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) {
      return false;
    }


    const isAuthenticated = await UnifiedGroupService.verifyUserAuthentication();
    if (!isAuthenticated) {
      toast({ 
        title: 'Session expirée', 
        description: 'Veuillez vous reconnecter.', 
        variant: 'destructive' 
      });
      return false;
    }

    setLoading(true);
    
    try {
      console.log('🎯 DÉBUT - Recherche/Création de groupe avec nouveau système');
      
      // 1. Géolocalisation fraîche
      console.log('📍 Géolocalisation...');
      const location = await getUserLocation(true);
      if (!location) {
        toast({ 
          title: 'Géolocalisation requise', 
          description: 'Votre position est nécessaire pour créer un groupe.', 
          variant: 'destructive' 
        });
        return false;
      }

      // 2. Vérification UNIFIÉE des participations existantes avec nouveau système
      console.log('🔍 Vérification des participations avec nouveau système...');
      const allParticipations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (allParticipations.length > 0) {
        console.log('⚠️ Participation active détectée avec nouveau système');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif.', 
          variant: 'destructive' 
        });
        return false;
      }

      // 3. Recherche de groupe compatible
      console.log('🌍 Recherche de groupe compatible...');
      const targetGroup = await GroupGeolocationService.findCompatibleGroup(location);

      if (!targetGroup) {
        // 4. Création de groupe neuf
        console.log('🆕 Création d\'un groupe neuf...');
        const newGroup = await UnifiedGroupService.createGroup(location, user.id);
        
        if (newGroup) {
          trackGroupCreate(newGroup.id);
          queryClient.invalidateQueries({ queryKey: ['unifiedUserGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '🎉 Nouveau groupe créé', 
            description: `Groupe créé à ${location.locationName}. Vous pouvez maintenant fermer l'app !`, 
          });
          return true;
        }
        return false;
      } else {
        // 5. Rejoindre groupe existant
        console.log('🔗 Rejoindre groupe compatible existant...');
        const success = await UnifiedGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          trackGroupJoin(targetGroup.id);
          queryClient.invalidateQueries({ queryKey: ['unifiedUserGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '✅ Groupe rejoint', 
            description: `Vous avez rejoint un groupe à ${location.locationName}. Vous pouvez fermer l'app !`, 
          });
        }
        return success;
      }
    } catch (error) {
      ErrorHandler.logError('JOIN_RANDOM_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de sortie avec nettoyage LOCAL seulement
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) {
      return;
    }


    setLoading(true);
    try {
      console.log('🚪 [UNIFIED] Sortie de groupe...');
      
      // 1. Nettoyage immédiat de l'état local
      setGroupMembers([]);
      queryClient.setQueryData(['unifiedUserGroups', user.id], []);

      // 2. Sortie du groupe
      const success = await UnifiedGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        // 3. Invalidation contrôlée du cache
        queryClient.invalidateQueries({ queryKey: ['unifiedUserGroups'] });
        
        toast({ 
          title: '✅ Groupe quitté', 
          description: 'Vous avez quitté le groupe avec succès.' 
        });
        
        // 4. Refetch après délai
        setTimeout(() => refetchGroups(), 1000);
      }
    } catch (error) {
      ErrorHandler.logError('LEAVE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
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
    fetchUserGroups,
    refetchGroups,
    // Debug info
    isHeartbeatActive,
    activeGroupId
  };
};
