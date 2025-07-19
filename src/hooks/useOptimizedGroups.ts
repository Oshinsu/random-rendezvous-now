import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { OptimizedGroupService } from '@/services/optimizedGroupService';
import { GroupGeolocationService } from '@/services/groupGeolocation';
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { ErrorHandler } from '@/utils/errorHandling';
import { showUniqueToast } from '@/utils/toastUtils';
import { RateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';
import type { LocationData } from '@/services/geolocation';

/**
 * Optimized unified hook that consolidates all group functionality
 * Removes code duplication and improves performance with intelligent caching
 */
export const useOptimizedGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  // Location caching refs
  const isGettingLocation = useRef(false);
  const locationPromise = useRef<Promise<LocationData | null> | null>(null);

  // Smart location retrieval with unified caching
  const getUserLocation = useCallback(async (forceRefresh = false): Promise<LocationData | null> => {
    if (!user) return null;

    // Use the optimized service's caching mechanism
    if (isGettingLocation.current && locationPromise.current) {
      return locationPromise.current;
    }

    isGettingLocation.current = true;
    locationPromise.current = OptimizedGroupService.getLocationWithCache(user.id, forceRefresh)
      .then((location) => {
        if (location) {
          setUserLocation(location);
          showUniqueToast(
            `Position détectée: ${location.locationName}`,
            "📍 Position actualisée"
          );
        }
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
  }, [user]);

  // Optimized group fetching with intelligent caching
  const fetchUserGroups = useCallback(async (): Promise<Group[]> => {
    if (!user) return [];

    try {
      console.log('📋 [OPTIMIZED] Fetching groups with intelligent caching');
      
      // Use the optimized service with caching
      const validGroups = await OptimizedGroupService.getUserGroups(user.id, true);
      
      // Update group members for the active group
      if (validGroups.length > 0) {
        const activeGroup = validGroups[0];
        
        // Update user activity
        await OptimizedGroupService.updateUserActivity(activeGroup.id, user.id);
        
        // Get group members
        const members = await OptimizedGroupService.getGroupMembers(activeGroup.id);
        setGroupMembers(members);
        
        console.log('✅ [OPTIMIZED] Active group members updated:', members.length);
      } else {
        setGroupMembers([]);
      }

      console.log('✅ [OPTIMIZED] Groups fetched successfully:', validGroups.length);
      return validGroups;
    } catch (error) {
      ErrorHandler.logError('OPTIMIZED_FETCH_USER_GROUPS', error);
      setGroupMembers([]);
      return [];
    }
  }, [user]);

  // React Query for group data with optimized settings
  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['optimizedUserGroups', user?.id],
    queryFn: fetchUserGroups,
    enabled: !!user,
    refetchInterval: GROUP_CONSTANTS.GROUP_REFETCH_INTERVAL,
    staleTime: GROUP_CONSTANTS.GROUP_STALE_TIME,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Activity heartbeat for active group
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: GROUP_CONSTANTS.HEARTBEAT_INTERVAL
  });

  // Smart group creation/joining with optimizations
  const joinRandomGroup = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) return false;

    // Rate limiting check
    if (RateLimiter.isRateLimited(`group_creation_${user.id}`, RATE_LIMITS.GROUP_CREATION)) {
      const status = RateLimiter.getStatus(`group_creation_${user.id}`);
      const remainingMinutes = Math.ceil(status.remainingTime / 60000);
      
      toast({ 
        title: 'Trop de tentatives', 
        description: `Veuillez attendre ${remainingMinutes} minute(s).`, 
        variant: 'destructive' 
      });
      return false;
    }

    setLoading(true);
    
    try {
      console.log('🎯 [OPTIMIZED] Starting smart group search/creation');
      
      // Verify authentication
      const authResult = await OptimizedGroupService.verifyAuthentication();
      if (!authResult.isValid) {
        toast({ 
          title: 'Session expirée', 
          description: 'Veuillez vous reconnecter.', 
          variant: 'destructive' 
        });
        return false;
      }

      // Get fresh location
      const location = await getUserLocation(true);
      if (!location) {
        toast({ 
          title: 'Géolocalisation requise', 
          description: 'Votre position est nécessaire pour créer un groupe.', 
          variant: 'destructive' 
        });
        return false;
      }

      // Check existing participations using optimized service
      const existingGroups = await OptimizedGroupService.getUserGroups(user.id, false); // Force fresh data
      if (existingGroups.length > 0) {
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif.', 
          variant: 'destructive' 
        });
        return false;
      }

      // Search for compatible group
      const targetGroup = await GroupGeolocationService.findCompatibleGroup(location);

      if (!targetGroup) {
        // Create new group
        console.log('🆕 [OPTIMIZED] Creating new group');
        const newGroup = await OptimizedGroupService.createGroup(location, user.id);
        
        if (newGroup) {
          // Invalidate cache and refetch
          queryClient.invalidateQueries({ queryKey: ['optimizedUserGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '🎉 Nouveau groupe créé', 
            description: `Groupe créé à ${location.locationName}. Vous pouvez fermer l'app !`, 
          });
          return true;
        }
        return false;
      } else {
        // Join existing group
        console.log('🔗 [OPTIMIZED] Joining compatible group');
        const success = await OptimizedGroupService.joinGroup(targetGroup.id, user.id, location);
        
        if (success) {
          // Invalidate cache and refetch
          queryClient.invalidateQueries({ queryKey: ['optimizedUserGroups'] });
          setTimeout(() => refetchGroups(), 500);
          
          toast({ 
            title: '✅ Groupe rejoint', 
            description: `Vous avez rejoint un groupe à ${location.locationName}. Vous pouvez fermer l'app !`, 
          });
        }
        return success;
      }
    } catch (error) {
      ErrorHandler.logError('OPTIMIZED_JOIN_RANDOM_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, loading, getUserLocation, queryClient, refetchGroups]);

  // Optimized group leaving
  const leaveGroup = useCallback(async (groupId: string): Promise<void> => {
    if (!user || loading) return;

    // Rate limiting check
    if (RateLimiter.isRateLimited(`group_leave_${user.id}`, RATE_LIMITS.GROUP_JOIN)) {
      toast({ 
        title: 'Trop de tentatives', 
        description: 'Veuillez attendre avant de quitter un groupe.', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚪 [OPTIMIZED] Leaving group with cleanup');
      
      // Clear local state immediately
      setGroupMembers([]);
      queryClient.setQueryData(['optimizedUserGroups', user.id], []);

      // Leave group using optimized service
      const success = await OptimizedGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['optimizedUserGroups'] });
        
        toast({ 
          title: '✅ Groupe quitté', 
          description: 'Vous avez quitté le groupe avec succès.' 
        });
        
        // Refetch after delay
        setTimeout(() => refetchGroups(), 1000);
      }
    } catch (error) {
      ErrorHandler.logError('OPTIMIZED_LEAVE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
    } finally {
      setLoading(false);
    }
  }, [user, loading, queryClient, refetchGroups]);

  // Cleanup function
  const performCleanup = useCallback(async (): Promise<void> => {
    try {
      await OptimizedGroupService.performSmartCleanup();
      // Refetch after cleanup
      setTimeout(() => refetchGroups(), 1000);
    } catch (error) {
      ErrorHandler.logError('CLEANUP', error);
    }
  }, [refetchGroups]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return OptimizedGroupService.getPerformanceMetrics();
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return OptimizedGroupService.getCacheStats();
  }, []);

  return {
    // Core data
    userGroups,
    groupMembers,
    userLocation,
    
    // Loading states
    loading: loading || groupsLoading,
    isHeartbeatActive,
    
    // Core actions
    joinRandomGroup,
    leaveGroup,
    getUserLocation,
    
    // Data management
    fetchUserGroups,
    refetchGroups,
    performCleanup,
    
    // Debugging and performance
    activeGroupId,
    getPerformanceMetrics,
    getCacheStats,
    
    // Cache management
    clearCaches: () => OptimizedGroupService.clearAllCaches()
  };
};