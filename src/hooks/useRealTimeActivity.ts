import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityEvent {
  id: string;
  type: 'user_join' | 'group_created' | 'group_confirmed' | 'group_completed' | 'user_signup' | 'message_sent';
  description: string;
  timestamp: string;
  metadata?: any;
}

interface LiveStats {
  activeUsers: number;
  pendingGroups: number;
  completedToday: number;
  signupsToday: number;
  messagesLast24h: number;
}

interface ActivityMetrics {
  hour: string;
  users_active: number;
  groups_created: number;
  messages_sent: number;
}

export const useRealTimeActivity = () => {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    activeUsers: 0,
    pendingGroups: 0,
    completedToday: 0,
    signupsToday: 0,
    messagesLast24h: 0
  });
  const [chartData, setChartData] = useState<ActivityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = async () => {
    try {
      const events: ActivityEvent[] = [];
      
      // Récupérer les groupes récemment créés
      const { data: recentGroups } = await supabase
        .from('groups')
        .select('id, created_at, location_name, status')
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les participations récentes
      const { data: recentParticipations } = await supabase
        .from('group_participants')
        .select('id, joined_at, group_id, groups(location_name)')
        .order('joined_at', { ascending: false })
        .limit(10);

      // Récupérer les messages récents
      const { data: recentMessages } = await supabase
        .from('group_messages')
        .select('id, created_at, group_id, is_system, groups(location_name)')
        .eq('is_system', false)
        .order('created_at', { ascending: false })
        .limit(10);

      // Convertir en événements d'activité
      recentGroups?.forEach(group => {
        events.push({
          id: `group-${group.id}`,
          type: group.status === 'confirmed' ? 'group_confirmed' : 
                group.status === 'completed' ? 'group_completed' : 'group_created',
          description: `Groupe ${group.status === 'confirmed' ? 'confirmé' : 
                       group.status === 'completed' ? 'terminé' : 'créé'} à ${group.location_name || 'localisation inconnue'}`,
          timestamp: group.created_at,
          metadata: { groupId: group.id }
        });
      });

      recentParticipations?.forEach(participation => {
        events.push({
          id: `join-${participation.id}`,
          type: 'user_join',
          description: `Utilisateur a rejoint le groupe à ${(participation.groups as any)?.location_name || 'localisation inconnue'}`,
          timestamp: participation.joined_at,
          metadata: { groupId: participation.group_id }
        });
      });

      recentMessages?.forEach(message => {
        events.push({
          id: `message-${message.id}`,
          type: 'message_sent',
          description: `Message envoyé dans le groupe à ${(message.groups as any)?.location_name || 'localisation inconnue'}`,
          timestamp: message.created_at,
          metadata: { groupId: message.group_id }
        });
      });

      // Trier par timestamp décroissant
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return events.slice(0, 15); // Garder les 15 plus récents
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  };

  const fetchLiveStats = async () => {
    try {
      // Utiliser la fonction get_admin_stats existante
      const { data: adminStats } = await supabase.rpc('get_admin_stats');
      
      // Calculer les utilisateurs actifs (last_seen dans les 15 dernières minutes)
      const { count: activeUsersCount } = await supabase
        .from('group_participants')
        .select('user_id', { count: 'exact', head: true })
        .gte('last_seen', new Date(Date.now() - 15 * 60 * 1000).toISOString())
        .eq('status', 'confirmed');

      // Compter les messages des dernières 24h
      const { count: messagesCount } = await supabase
        .from('group_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .eq('is_system', false);

      if (adminStats) {
        const stats = adminStats as any;
        setLiveStats({
          activeUsers: activeUsersCount || 0,
          pendingGroups: stats.waiting_groups || 0,
          completedToday: stats.groups_today || 0,
          signupsToday: stats.signups_today || 0,
          messagesLast24h: messagesCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching live stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const last24Hours = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
        return {
          hour: hour.getHours().toString().padStart(2, '0') + ':00',
          startTime: new Date(hour.setMinutes(0, 0, 0)),
          endTime: new Date(hour.setMinutes(59, 59, 999))
        };
      });

      const chartMetrics: ActivityMetrics[] = [];

      for (const timeSlot of last24Hours) {
        // Compter les utilisateurs actifs pour cette heure
        const { count: activeUsers } = await supabase
          .from('group_participants')
          .select('user_id', { count: 'exact', head: true })
          .gte('last_seen', timeSlot.startTime.toISOString())
          .lte('last_seen', timeSlot.endTime.toISOString())
          .eq('status', 'confirmed');

        // Compter les groupes créés pour cette heure
        const { count: groupsCreated } = await supabase
          .from('groups')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', timeSlot.startTime.toISOString())
          .lte('created_at', timeSlot.endTime.toISOString());

        // Compter les messages envoyés pour cette heure
        const { count: messagesSent } = await supabase
          .from('group_messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', timeSlot.startTime.toISOString())
          .lte('created_at', timeSlot.endTime.toISOString())
          .eq('is_system', false);

        chartMetrics.push({
          hour: timeSlot.hour,
          users_active: activeUsers || 0,
          groups_created: groupsCreated || 0,
          messages_sent: messagesSent || 0
        });
      }

      setChartData(chartMetrics);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [recentActivity] = await Promise.all([
        fetchRecentActivity(),
        fetchLiveStats(),
        fetchChartData()
      ]);
      
      setActivity(recentActivity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchAllData, 30000);

    // Écouter les changements en temps réel
    const groupsChannel = supabase
      .channel('admin-groups-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'groups' },
        () => fetchAllData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'group_participants' },
        () => fetchAllData()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(groupsChannel);
    };
  }, []);

  return {
    activity,
    liveStats,
    chartData,
    loading,
    error,
    refetch: fetchAllData
  };
};