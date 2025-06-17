import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from '@/services/groupGeolocation';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { UnifiedGroupRetrievalService } from '@/services/unifiedGroupRetrieval';
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { ErrorHandler } from '@/utils/errorHandling';
import { showUniqueToast } from '@/utils/toastUtils';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useUnifiedGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  const isGettingLocation = useRef(false);
  const locationPromise = useRef<Promise<LocationData> | null>(null);
  const lastLocationTime = useRef<number>(0);

  // Cache de localisation avec expiration de 10 minutes
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    const now = Date.now();
    const locationCacheTime = 10 * 60 * 1000; // 10 minutes
    
    if (!forceRefresh && userLocation && (now - lastLocationTime.current) < locationCacheTime) {
      console.log('📍 Utilisation de la position en cache:', userLocation.locationName);
      return userLocation;
    }

    if (isGettingLocation.current && locationPromise.current) {
      return locationPromise.current;
    }

    isGettingLocation.current = true;
    console.log('📍 Demande de géolocalisation FRAÎCHE');

    locationPromise.current = GeolocationService.getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
        lastLocationTime.current = now;
        showUniqueToast(
          `Position détectée: ${location.locationName}`,
          "📍 Position actualisée"
        );
        console.log('✅ Nouvelle position obtenue:', location);
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

  // ENHANCED unified group fetching with auto-recovery
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) {
      return [];
    }

    try {
      console.log('📋 [UNIFIED] Recherche des groupes avec système RENFORCÉ');
      
      // 1. Retrieve ALL participations with minimal filtering
      const allParticipations = await UnifiedGroupRetrievalService.getUserParticipations(user.id);
      console.log('📋 [UNIFIED] Participations récupérées (total):', allParticipations.length);
      
      // 2. AUTO-RECOVERY: Update last_seen for all participations
      if (allParticipations.length > 0) {
        console.log('🔄 [UNIFIED] Déclenchement auto-récupération');
        await UnifiedGroupRetrievalService.recoverUserActivity(user.id, allParticipations);
      }
      
      // 3. Apply VERY lenient client-side filtering (24h instead of 3h)
      const activeParticipations = UnifiedGroupRetrievalService.filterActiveParticipations(allParticipations);
      console.log('📋 [UNIFIED] Participations actives après filtrage LENIENT:', activeParticipations.length);
      
      // 4. Extract valid groups
      const validGroups = UnifiedGroupRetrievalService.extractValidGroups(activeParticipations);

      // 5. Update user activity and get members for first group
      if (validGroups.length > 0) {
        await UnifiedGroupRetrievalService.updateUserActivity(validGroups[0].id, user.id);
        const members = await UnifiedGroupRetrievalService.getGroupMembers(validGroups[0].id);
        setGroupMembers(members);
      } else {
        setGroupMembers([]);
      }

      console.log('✅ [UNIFIED] Groupes valides avec système RENFORCÉ:', validGroups.length);
      return validGroups;
    } catch (error) {
      ErrorHandler.logError('FETCH_USER_GROUPS', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
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
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL, // Now 30 seconds
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME, // Now 15 seconds
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // ENHANCED activity heartbeat - activate when user has an active group
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL // Now 20 seconds
  });

  console.log('💓 [UNIFIED] Heartbeat RENFORCÉ status:', { 
    activeGroupId, 
    isHeartbeatActive, 
    hasGroups: userGroups.length > 0,
    heartbeatInterval: GROUP_CONSTANTS.HEARTBEAT_INTERVAL
  });

  // Fonction de création de groupe
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
      const allParticipations = await UnifiedGroupRetrievalService.getUserParticipations(user.id);
      const activeParticipations = UnifiedGroupRetrievalService.filterActiveParticipations(allParticipations);
      
      if (activeParticipations.length > 0) {
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
