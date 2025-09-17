import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
import { SystemMessagingService } from '@/services/systemMessaging';

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
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sentMarkersRef = useRef<Set<string>>(new Set());

  const { track } = useAnalytics();

  // PLAN D'URGENCE: Désactiver heartbeat pour éviter surcharge
  const OPTIMIZED_INTERVALS = {
    REFETCH_INTERVAL: 5 * 60 * 1000, // 5 minutes (PLAN D'URGENCE: réduit)
    STALE_TIME: 2 * 60 * 1000, // 2 minutes (PLAN D'URGENCE: réduit)
    HEARTBEAT_INTERVAL: 0, // DÉSACTIVÉ pour plan d'urgence
  };

  // Fetch user groups with optimized caching
  const fetchUserGroups = async (): Promise<Group[]> => {
    if (!user) return [];

    try {
      const allParticipations = await UnifiedGroupService.getUserParticipations(user.id);
      const validGroups = allParticipations.map(p => p.groups).filter(Boolean);

      // Update members for first active group
      if (validGroups.length > 0) {
        await UnifiedGroupService.updateUserLastSeen(validGroups[0].id, user.id);
        const members = await UnifiedGroupService.getGroupMembers(validGroups[0].id);
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

  // PLAN D'URGENCE: Heartbeat complètement désactivé
  const activeGroupId = userGroups.length > 0 ? userGroups[0].id : null;
  const { isActive: isHeartbeatActive } = useActivityHeartbeat({
    groupId: activeGroupId,
    enabled: false, // DÉSACTIVÉ pour plan d'urgence
    intervalMs: OPTIMIZED_INTERVALS.HEARTBEAT_INTERVAL
  });

  // Setup Realtime subscriptions for instant updates
  useEffect(() => {
    if (!user) return;

    logger.info('Setting up Realtime subscriptions for instant group updates');

    // Demander les permissions de notifications dès l'initialisation
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          logger.info('Notification permission:', permission);
        } catch (e) {
          logger.debug('Notification permission request failed', e);
        }
      }
    };
    requestNotificationPermission();

    // helper: play a short joyful pop
    const playPop = (freq = 700) => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } catch (e) {
        // ignore
      }
    };

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

              // Browser notification
              try {
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Groupe complet 🎉', { body: 'Votre groupe est prêt, bar en attribution.', icon: '/favicon.ico' });
                  }
              } catch {}
              
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
          
          // Vérifier si l'utilisateur est membre de CE groupe (pas seulement le groupe actif)
          const { data: isParticipant } = await supabase
            .from('group_participants')
            .select('id')
            .eq('group_id', payload.new.group_id)
            .eq('user_id', user.id)
            .eq('status', 'confirmed')
            .single();

          if (isParticipant) {
            // Play arrival effect + broadcast to UI
            playPop(820);
            try { window.dispatchEvent(new CustomEvent('group:member-joined', { detail: { groupId: activeGroupId } })); } catch {}

            // Get current group info to know participant count
            const { data: groupData } = await supabase
              .from('groups')
              .select('current_participants, max_participants')
              .eq('id', payload.new.group_id)
              .single();

            if (groupData) {
              const count = groupData.current_participants;
              let message = '';
              let title = '';

              // Notifications selon le nombre de participants
              if (count === 2) {
                title = 'Nouveau membre !';
                message = 'Quelqu\'un a rejoint votre groupe ! (2/5)';
              } else if (count === 3) {
                title = 'Groupe qui se remplit !';
                message = 'Votre groupe se remplit ! (3/5)';
              } else if (count === 4) {
                title = 'Plus qu\'une place !';
                message = 'Plus qu\'une place ! (4/5)';
              } else if (count === 5) {
                title = 'Groupe complet !';
                message = 'Groupe complet ! Recherche de bar...';
              }

              if (message) {
                // Toast notification
                showUniqueToast(message, title);

                // Browser push notification
                try {
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(title, { 
                      body: message, 
                      icon: '/favicon.ico',
                      tag: `group-${payload.new.group_id}-${count}` // Évite les doublons
                    });
                  }
                } catch (e) {
                  logger.debug('Browser notification failed', e);
                }
              }
            }

            // System message (light client-side guard)
            const key = `join-${payload.new.group_id}`;
            if (!sentMarkersRef.current.has(key)) {
              sentMarkersRef.current.add(key);
              setTimeout(() => sentMarkersRef.current.delete(key), 5000);
              SystemMessagingService.createJoinMessage(payload.new.group_id);
            }

            // Immediately update members and group data
            queryClient.invalidateQueries({ queryKey: ['realtimeUserGroups'] });
            setTimeout(() => refetchGroups(), 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'group_participants',
        },
        async (payload) => {
          logger.debug('Participant left via Realtime', payload);
          playPop(480);
          try { window.dispatchEvent(new CustomEvent('group:member-left', { detail: { groupId: activeGroupId } })); } catch {}
          const gId = (payload as any).old?.group_id;
          if (gId) {
            const key = `leave-${gId}`;
            if (!sentMarkersRef.current.has(key)) {
              sentMarkersRef.current.add(key);
              setTimeout(() => sentMarkersRef.current.delete(key), 5000);
              SystemMessagingService.createLeaveMessage(gId);
            }
          }
          if (activeGroupId === gId) {
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
      // CRITIQUE: Valider et sanitiser les coordonnées du cache
      const { CoordinateValidator } = await import('@/utils/coordinateValidation');
      const validation = CoordinateValidator.validateCoordinates(userLocation.latitude, userLocation.longitude);
      
      if (!validation.isValid) {
        console.warn('🚨 Realtime cached coordinates are invalid, forcing refresh');
        return await getUserLocation(true);
      }
      
      // Sanitiser si nécessaire
      if (validation.sanitized && 
          (validation.sanitized.latitude !== userLocation.latitude || 
           validation.sanitized.longitude !== userLocation.longitude)) {
        console.log('🔧 Sanitisation des coordonnées du cache realtime');
        const sanitizedLocation = {
          ...userLocation,
          latitude: validation.sanitized.latitude,
          longitude: validation.sanitized.longitude
        };
        setUserLocation(sanitizedLocation);
        return sanitizedLocation;
      }
      
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
      const allParticipations = await UnifiedGroupService.getUserParticipations(user.id);
      
      if (allParticipations.length > 0) {
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