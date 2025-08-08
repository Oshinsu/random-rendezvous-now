import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedGroupRetrievalService } from '@/services/enhancedGroupRetrieval';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { UnifiedGroupService } from '@/services/unifiedGroupService';
import { useActivityHeartbeat } from '@/hooks/useActivityHeartbeat';
import { showUniqueToast } from '@/utils/toastUtils';
import { toast } from '@/hooks/use-toast';
import { ErrorHandler } from '@/utils/errorHandling';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';
import { logger } from '@/utils/cleanLogging';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * Optimized hook with Realtime subscriptions for instant group updates
 * This eliminates the delay when groups become full by listening to database changes
 */
export const useRealtimeGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  const channelRef = useRef<any>(null);
  const lastGroupCompletionRef = useRef<Set<string>>(new Set());

  const { track } = useAnalytics();

  // Optimized intervals for reduced latency
  const OPTIMIZED_INTERVALS = {
    REFETCH_INTERVAL: 30 * 1000, // 30 seconds (reduced from 2 minutes)
    STALE_TIME: 15 * 1000, // 15 seconds (reduced from 90 seconds)
    HEARTBEAT_INTERVAL: 2 * 60 * 1000, // 2 minutes (reduced from 10 minutes)
  };

  // Fetch user groups with optimized caching
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) return [];

    try {
      const allParticipations = await EnhancedGroupRetrievalService.getUserParticipations(user.id);
      const activeParticipations = EnhancedGroupRetrievalService.filterActiveParticipations(allParticipations);
      const validGroups = EnhancedGroupRetrievalService.extractValidGroups(activeParticipations);

      // Update members for first active group
      if (validGroups.length > 0) {
        await EnhancedGroupRetrievalService.updateUserActivity(validGroups[0].id, user.id);
        const members = await EnhancedGroupRetrievalService.getGroupMembers(validGroups[0].id);
        setGroupMembers(members);
      } else {
        setGroupMembers([]);
      }

      return validGroups;
    } catch (error) {
      ErrorHandler.logError('REALTIME_FETCH_USER_GROUPS', error);
      return [];
    }
  };

  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['realtimeUserGroups', user?.id],
    queryFn: fetchUserGroups,
    enabled: !!user,
    refetchInterval: OPTIMIZED_INTERVALS.REFETCH_INTERVAL,
    staleTime: OPTIMIZED_INTERVALS.STALE_TIME,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Activity heartbeat with optimized interval
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: !!activeGroupId,
    intervalMs: OPTIMIZED_INTERVALS.HEARTBEAT_INTERVAL
  });

  // Setup Realtime subscriptions for instant updates
  useEffect(() => {
    if (!user) return;

    logger.info('Setting up Realtime subscriptions for instant group updates');

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create new channel for group updates
    channelRef.current = supabase
      .channel('group-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
          filter: `status=eq.confirmed`,
        },
        async (payload) => {
          logger.debug('Group confirmed via Realtime', payload);
          
          const updatedGroup = payload.new as Group;
          
          // Check if this user is in this group
          if (activeGroupId === updatedGroup.id || 
              userGroups.some(group => group.id === updatedGroup.id)) {
            
            // Show immediate notification for group completion
            if (updatedGroup.current_participants === updatedGroup.max_participants &&
                !lastGroupCompletionRef.current.has(updatedGroup.id)) {
              
              lastGroupCompletionRef.current.add(updatedGroup.id);
              
              showUniqueToast(
                `🎉 Votre groupe de ${updatedGroup.max_participants} personnes est complet ! Un bar va être assigné automatiquement.`,
                "Groupe complet"
              );
              
              // Clean up the completion tracking after 30 seconds
              setTimeout(() => {
                lastGroupCompletionRef.current.delete(updatedGroup.id);
              }, 30000);
            }
            
            // Immediately invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['realtimeUserGroups'] });
            setTimeout(() => refetchGroups(), 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groups',
        },
        async (payload) => {
          const updatedGroup = payload.new as Group;

          // Track scheduled group activation (is_scheduled: true -> false)
          if ((payload as any).old && (payload as any).old.is_scheduled === true && (updatedGroup as any).is_scheduled === false) {
            track('scheduled_group_activated', { group_id: updatedGroup.id });
          }
          
          // Listen for bar assignments
          if (updatedGroup.bar_name && 
              (activeGroupId === updatedGroup.id || 
               userGroups.some(group => group.id === updatedGroup.id))) {
            
            logger.info('Bar assigned via Realtime', { bar_name: updatedGroup.bar_name });
            
            showUniqueToast(
              `🍺 Bar assigné: ${updatedGroup.bar_name}`,
              "Rendez-vous confirmé"
            );
            
            // Immediately update data
            queryClient.invalidateQueries({ queryKey: ['realtimeUserGroups'] });
            setTimeout(() => refetchGroups(), 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_participants',
        },
        async (payload) => {
          logger.debug('New participant joined via Realtime', payload);
          
          // Check if it's for user's active group
          if (activeGroupId === payload.new.group_id) {
            // Immediately update members and group data
            queryClient.invalidateQueries({ queryKey: ['realtimeUserGroups'] });
            setTimeout(() => refetchGroups(), 100);
          }
        }
      )
      .subscribe();

    logger.info('Realtime subscriptions established');

    return () => {
      if (channelRef.current) {
        logger.info('Cleaning up Realtime subscriptions');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, activeGroupId, userGroups.length]);

  // Get user location with caching
  const getUserLocation = async (forceRefresh = false): Promise<LocationData | null> => {
    if (!forceRefresh && userLocation) {
      return userLocation;
    }

    try {
      const location = await GeolocationService.getCurrentLocation();
      setUserLocation(location);
      showUniqueToast(
        `Position détectée: ${location.locationName}`,
        "📍 Position actualisée"
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

  // Optimized join random group function
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
      // Verify authentication
      const isAuthenticated = await UnifiedGroupService.verifyUserAuthentication();
      if (!isAuthenticated) {
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

      // Check existing participations
      const allParticipations = await EnhancedGroupRetrievalService.getUserParticipations(user.id);
      const activeParticipations = EnhancedGroupRetrievalService.filterActiveParticipations(allParticipations);
      
      if (activeParticipations.length > 0) {
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif.', 
          variant: 'destructive' 
        });
        return false;
      }

      // Try to join or create group
      const success = await UnifiedGroupService.createGroup(location, user.id);
      
      if (success) {
        // Immediate cache invalidation for instant UI update
        queryClient.invalidateQueries({ queryKey: ['realtimeUserGroups'] });
        setTimeout(() => refetchGroups(), 100);
        
        toast({ 
          title: '🎉 Groupe créé', 
          description: `Groupe créé à ${location.locationName}. En attente d'autres participants...`, 
        });
        return true;
      }
      
      return false;
    } catch (error) {
      ErrorHandler.logError('REALTIME_JOIN_RANDOM_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Optimized leave group function
  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) return;

    setLoading(true);
    try {
      // Clear local state immediately
      setGroupMembers([]);
      queryClient.setQueryData(['realtimeUserGroups', user.id], []);

      // Leave group
      const success = await UnifiedGroupService.leaveGroup(groupId, user.id);
      
      if (success) {
        // Immediate cache invalidation
        queryClient.invalidateQueries({ queryKey: ['realtimeUserGroups'] });
        
        toast({ 
          title: '✅ Groupe quitté', 
          description: 'Vous avez quitté le groupe avec succès.' 
        });
        
        setTimeout(() => refetchGroups(), 100);
      }
    } catch (error) {
      ErrorHandler.logError('REALTIME_LEAVE_GROUP', error);
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
    isHeartbeatActive,
    activeGroupId,
    // Debug info
    optimizedIntervals: OPTIMIZED_INTERVALS,
    realtimeActive: !!channelRef.current,
  };
};