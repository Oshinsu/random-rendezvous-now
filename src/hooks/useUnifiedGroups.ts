import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSessionProtection } from '@/hooks/useSessionProtection';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from '@/services/groupGeolocation';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { EnhancedGroupRetrievalService } from '@/services/enhancedGroupRetrieval';
import { UnifiedCleanupService } from '@/services/unifiedCleanupService';
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { ErrorHandler } from '@/utils/errorHandling';
import { showUniqueToast } from '@/utils/toastUtils';
import { RateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';
import { CoordinateValidator } from '@/utils/coordinateValidation';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useUnifiedGroups = () => {
  const { user } = useAuth();
  const { trackGroupCreate, trackGroupJoin } = useAnalytics();
  const { protectOperation } = useSessionProtection();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  const isGettingLocation = useRef(false);
  const locationPromise = useRef<Promise<LocationData> | null>(null);
  const lastLocationTime = useRef<number>(0);

  // Cache de localisation avec expiration UNIFIÉE
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    const now = Date.now();
    const locationCacheTime = 10 * 60 * 1000; // 10 minutes
    
    if (!forceRefresh && userLocation && (now - lastLocationTime.current) < locationCacheTime) {
      console.log('📍 Utilisation de la position en cache:', userLocation.locationName);
      
      // Validate cached coordinates
      const validation = CoordinateValidator.validateCoordinates(userLocation.latitude, userLocation.longitude);
      if (!validation.isValid) {
        console.warn('🚨 Cached coordinates are invalid, forcing refresh');
        return await getUserLocation(true);
      }
      
      return userLocation;
    }

    if (isGettingLocation.current && locationPromise.current) {
      return locationPromise.current;
    }

    isGettingLocation.current = true;
    console.log('📍 Demande de géolocalisation avec paramètres unifiés');

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

  // Récupération UNIFIÉE des groupes avec système amélioré
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) {
      return [];
    }

    try {
      console.log('📋 [UNIFIED HOOK] Recherche des groupes avec système UNIFIÉ et AMÉLIORÉ');
      
      // 1. Récupération avec service amélioré
      const allParticipations = await EnhancedGroupRetrievalService.getUserParticipations(user.id);
      console.log('📋 [UNIFIED HOOK] Participations récupérées (total):', allParticipations.length);
      
      // 2. Auto-récupération améliorée
      if (allParticipations.length > 0) {
        console.log('🔄 [UNIFIED HOOK] Déclenchement auto-récupération améliorée');
        await EnhancedGroupRetrievalService.recoverUserActivity(user.id, allParticipations);
      }
      
      // 3. Filtrage unifié côté client
      const activeParticipations = EnhancedGroupRetrievalService.filterActiveParticipations(allParticipations);
      console.log('📋 [UNIFIED HOOK] Participations actives après filtrage unifié:', activeParticipations.length);
      
      // 4. Extraction des groupes valides
      const validGroups = EnhancedGroupRetrievalService.extractValidGroups(activeParticipations);

      // 5. Mise à jour des membres avec service amélioré
      if (validGroups.length > 0) {
        await EnhancedGroupRetrievalService.updateUserActivity(validGroups[0].id, user.id);
        const members = await EnhancedGroupRetrievalService.getGroupMembers(validGroups[0].id);
        setGroupMembers(members);
        
        // Check if group just became full and show notification
        const currentGroup = validGroups[0];
        if (currentGroup.current_participants === currentGroup.max_participants && 
            currentGroup.status === 'confirmed') {
          // Only show notification if this is a recently updated group
          const groupAge = Date.now() - new Date(currentGroup.created_at).getTime();
          const recentThreshold = 30 * 1000; // 30 seconds
          
          if (groupAge > recentThreshold) {
            showUniqueToast(
              `Votre groupe de ${currentGroup.max_participants} personnes est complet ! Un bar va être assigné.`,
              "🎉 Groupe complet"
            );
          }
        }
      } else {
        setGroupMembers([]);
      }

      console.log('✅ [UNIFIED HOOK] Groupes valides avec système UNIFIÉ:', validGroups.length);
      return validGroups;
    } catch (error) {
      ErrorHandler.logError('UNIFIED_FETCH_USER_GROUPS', error);
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
    refetchInterval: false, // DISABLED automatic refetching
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false, // DISABLED
  });

  // Battement de cœur d'activité UNIFIÉ
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL
  });

  console.log('💓 [UNIFIED HOOK] Heartbeat status:', { 
    activeGroupId, 
    isHeartbeatActive, 
    hasGroups: userGroups.length > 0,
    heartbeatInterval: GROUP_CONSTANTS.HEARTBEAT_INTERVAL
  });

  // Fonction de création de groupe avec rate limiting et protection de session
  const joinRandomGroup = async (): Promise<boolean> => {
    return protectOperation(async () => {
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

      // Apply rate limiting
      if (RateLimiter.isRateLimited(`group_creation_${user.id}`, RATE_LIMITS.GROUP_CREATION)) {
        const status = RateLimiter.getStatus(`group_creation_${user.id}`);
        const remainingMinutes = Math.ceil(status.remainingTime / 60000);
        
        toast({ 
          title: 'Trop de tentatives', 
          description: `Veuillez attendre ${remainingMinutes} minute(s) avant de créer un nouveau groupe.`, 
          variant: 'destructive' 
        });
        return false;
      }

      // Enhanced authentication check with session monitoring
      console.log('🚀 [SESSION PROTECTION] Starting group operation with enhanced monitoring', {
        userId: user.id,
        timestamp: new Date().toISOString(),
        sessionExists: !!user,
        hasLocation: !!userLocation
      });

      const isAuthenticated = await UnifiedGroupService.verifyUserAuthentication();
      if (!isAuthenticated) {
        console.error('🚨 [SESSION PROTECTION] Authentication verification failed');
        toast({ 
          title: 'Session expirée', 
          description: 'Veuillez vous reconnecter.', 
          variant: 'destructive' 
        });
        return false;
      }

      setLoading(true);
      
      try {
        console.log('🎯 DÉBUT - Recherche/Création de groupe avec nouveau système et protection de session');
        
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
        const allParticipations = await EnhancedGroupRetrievalService.getUserParticipations(user.id);
        const activeParticipations = EnhancedGroupRetrievalService.filterActiveParticipations(allParticipations);
        
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
            console.log('✅ [SESSION PROTECTION] Group creation successful');
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
            console.log('✅ [SESSION PROTECTION] Group join successful');
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
        console.error('🚨 [SESSION PROTECTION] Group operation failed', {
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        
        ErrorHandler.logError('JOIN_RANDOM_GROUP', error);
        const appError = ErrorHandler.handleGenericError(error as Error);
        ErrorHandler.showErrorToast(appError);
        return false;
      } finally {
        setLoading(false);
      }
    });
  };

  // Fonction de sortie avec nettoyage LOCAL seulement
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) {
      return;
    }

    // Apply rate limiting
    if (RateLimiter.isRateLimited(`group_leave_${user.id}`, RATE_LIMITS.GROUP_JOIN)) {
      toast({ 
        title: 'Trop de tentatives', 
        description: 'Veuillez attendre avant de quitter/rejoindre un groupe.', 
        variant: 'destructive' 
      });
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
