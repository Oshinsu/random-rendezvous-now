import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface ActivityEvent {
  id: string;
  type: 'user_joined' | 'group_created' | 'group_confirmed' | 'group_completed' | 'message_sent';
  timestamp: string;
  data: {
    groupId?: string;
    userName?: string;
    barName?: string;
    location?: string;
    status?: string;
  };
}

interface LiveStats {
  activeUsers: number;
  pendingGroups: number;
  completedGroups: number;
  signups: number;
  messages: number;
}

interface ActivityMetrics {
  hour: string;
  users_active: number;
  groups_created: number;
  messages_sent: number;
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export const useRealTimeActivity = (period: TimePeriod = 'day') => {
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [chartData, setChartData] = useState<ActivityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔧 FIX: Protection contre memory leak
  const isActiveRef = useRef(true);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return { startDate, endDate: now };
  };

  const fetchRecentActivity = async () => {
    try {
      const { startDate } = getDateRange();
      
      // Fetch recent groups within time period
      const { data: recentGroups } = await supabase
        .from('groups')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch recent participants within time period
      const { data: recentParticipants } = await supabase
        .from('group_participants')
        .select('*')
        .gte('joined_at', startDate.toISOString())
        .order('joined_at', { ascending: false })
        .limit(100);

      // Fetch recent messages within time period
      const { data: recentMessages } = await supabase
        .from('group_messages')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      const events: ActivityEvent[] = [];

      // Process groups
      recentGroups?.forEach(group => {
        events.push({
          id: group.id,
          type: 'group_created',
          timestamp: group.created_at,
          data: {
            groupId: group.id,
            location: group.location_name || 'Location inconnue',
            status: group.status
          }
        });

        if (group.status === 'confirmed' && group.bar_name) {
          events.push({
            id: `${group.id}_confirmed`,
            type: 'group_confirmed',
            timestamp: group.created_at,
            data: {
              groupId: group.id,
              barName: group.bar_name
            }
          });
        }
      });

      // Process participants
      recentParticipants?.forEach(participant => {
        events.push({
          id: participant.id,
          type: 'user_joined',
          timestamp: participant.joined_at,
          data: {
            groupId: participant.group_id,
            userName: 'Utilisateur'
          }
        });
      });

      // Process messages
      recentMessages?.filter(msg => !msg.is_system).forEach(message => {
        events.push({
          id: message.id,
          type: 'message_sent',
          timestamp: message.created_at,
          data: {
            groupId: message.group_id,
            userName: 'Utilisateur'
          }
        });
      });

      // Sort events by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // 🔧 FIX: Vérifier si toujours actif avant de mettre à jour
      if (isActiveRef.current) {
        setActivityEvents(events.slice(0, 50));
      }
    } catch (error) {
      logger.error('Erreur fetch recent activity', error);
    }
  };

  const fetchLiveStats = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Use the new secure RPC function to get accurate signup and user stats
      const { data: signupStats } = await supabase
        .rpc('get_signup_stats', {
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString()
        });

      // Count pending groups (not filtered by period, as it's current state)
      const { count: pendingGroupsCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');

      // Count completed groups in the period
      const { count: completedGroupsCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString());

      // Count messages sent in the period
      const { count: messagesCount } = await supabase
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_system', false)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // 🔧 FIX: Vérifier si toujours actif avant de mettre à jour
      if (isActiveRef.current) {
        setLiveStats({
          activeUsers: (signupStats as any)?.active_users_in_period || 0,
          pendingGroups: pendingGroupsCount || 0,
          completedGroups: completedGroupsCount || 0,
          signups: (signupStats as any)?.signups_in_period || 0,
          messages: messagesCount || 0
        });
      }
    } catch (error) {
      logger.error('Erreur fetch live stats', error);
      // Set fallback values
      if (isActiveRef.current) {
        setLiveStats({
          activeUsers: 0,
          pendingGroups: 0,
          completedGroups: 0,
          signups: 0,
          messages: 0
        });
      }
    }
  };

  const fetchChartData = async () => {
    try {
      const { startDate } = getDateRange();
      
      // Different intervals based on period
      let intervals: Date[] = [];
      let formatOptions: Intl.DateTimeFormatOptions;
      
      if (period === 'day') {
        // Last 24 hours by hour
        intervals = Array.from({ length: 24 }, (_, i) => {
          const hour = new Date();
          hour.setHours(hour.getHours() - (23 - i), 0, 0, 0);
          return hour;
        });
        formatOptions = { hour: '2-digit', minute: '2-digit' };
      } else if (period === 'week') {
        // Last 7 days
        intervals = Array.from({ length: 7 }, (_, i) => {
          const day = new Date();
          day.setDate(day.getDate() - (6 - i));
          day.setHours(0, 0, 0, 0);
          return day;
        });
        formatOptions = { weekday: 'short' };
      } else if (period === 'month') {
        // Last 30 days, grouped by 3-day periods
        intervals = Array.from({ length: 10 }, (_, i) => {
          const day = new Date();
          day.setDate(day.getDate() - (9 - i) * 3);
          day.setHours(0, 0, 0, 0);
          return day;
        });
        formatOptions = { day: '2-digit', month: '2-digit' };
      } else {
        // Last 12 months
        intervals = Array.from({ length: 12 }, (_, i) => {
          const month = new Date();
          month.setMonth(month.getMonth() - (11 - i));
          month.setDate(1);
          month.setHours(0, 0, 0, 0);
          return month;
        });
        formatOptions = { month: 'short' };
      }

      const chartMetrics: ActivityMetrics[] = [];

      for (let i = 0; i < intervals.length; i++) {
        const currentInterval = intervals[i];
        const nextInterval = intervals[i + 1] || new Date();
        
        // Count activities in this interval
        const [groupsResult, participantsResult, messagesResult] = await Promise.all([
          supabase
            .from('groups')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentInterval.toISOString())
            .lt('created_at', nextInterval.toISOString()),
          supabase
            .from('group_participants')
            .select('*', { count: 'exact', head: true })
            .gte('joined_at', currentInterval.toISOString())
            .lt('joined_at', nextInterval.toISOString()),
          supabase
            .from('group_messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_system', false)
            .gte('created_at', currentInterval.toISOString())
            .lt('created_at', nextInterval.toISOString())
        ]);

        chartMetrics.push({
          hour: currentInterval.toLocaleString('fr-FR', formatOptions),
          users_active: participantsResult.count || 0,
          groups_created: groupsResult.count || 0,
          messages_sent: messagesResult.count || 0
        });
      }

      // 🔧 FIX: Vérifier si toujours actif avant de mettre à jour
      if (isActiveRef.current) {
        setChartData(chartMetrics);
      }
    } catch (error) {
      logger.error('Erreur fetch chart data', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchRecentActivity(),
        fetchLiveStats(),
        fetchChartData()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔧 FIX: Marquer comme actif au montage
    isActiveRef.current = true;
    
    fetchAllData();

    // Polling réduit au maximum (Realtime gère les updates)
    const pollInterval = period === 'day' ? 300000 : period === 'week' ? 600000 : 900000; // 5/10/15 min
    const interval = setInterval(() => {
      // 🔧 FIX: Ne fetch que si toujours actif
      if (isActiveRef.current) {
        fetchAllData();
      }
    }, pollInterval);

    // ✅ OPTIMISATION: Single channel with throttled updates (5 seconds)
    let channel: any = null;
    let throttleTimeout: NodeJS.Timeout | null = null;
    
    const throttledFetchAllData = () => {
      // 🔧 FIX: Ne fetch que si toujours actif
      if (!isActiveRef.current) return;
      if (throttleTimeout) return;
      
      throttleTimeout = setTimeout(() => {
        if (isActiveRef.current) {
          fetchAllData();
        }
        throttleTimeout = null;
      }, 5000);
    };
    
    if (period === 'day') {
      channel = supabase
        .channel('admin_unified_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'groups' 
        }, throttledFetchAllData)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'group_participants' 
        }, throttledFetchAllData)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'group_messages' 
        }, throttledFetchAllData)
        .subscribe();
    }

    return () => {
      // 🔧 FIX: Marquer comme inactif au démontage
      isActiveRef.current = false;
      clearInterval(interval);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      if (channel) {
        supabase.removeChannel(channel);
        logger.debug('Nettoyage admin realtime channel');
      }
    };
  }, [period]);

  return {
    activityEvents,
    liveStats,
    chartData,
    loading,
    error,
    refetch: fetchAllData
  };
};