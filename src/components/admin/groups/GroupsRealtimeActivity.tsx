import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Users, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useState } from 'react';

interface RecentGroup {
  id: string;
  status: string;
  created_at: string;
  location_name: string;
  current_participants: number;
}

export const GroupsRealtimeActivity = () => {
  const [liveMetrics, setLiveMetrics] = useState({
    activeNow: 0,
    createdLastHour: 0,
    conversionRate: 0,
    avgFormationTime: 0,
  });

  // Recent groups (refetch every 5s)
  const { data: recentGroups = [] } = useQuery({
    queryKey: ['admin-groups-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, status, created_at, location_name, current_participants')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as RecentGroup[];
    },
    refetchInterval: 5000,
  });

  // Live metrics (refetch every 5s)
  useEffect(() => {
    const fetchLiveMetrics = async () => {
      // Active participants now (<5min last_seen)
      const { count: activeCount } = await supabase
        .from('group_participants')
        .select('*', { count: 'exact', head: true })
        .gt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      // Groups created last hour
      const { count: createdCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Conversion rate last hour
      const { data: lastHourGroups } = await supabase
        .from('groups')
        .select('status')
        .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      const confirmed = lastHourGroups?.filter(g => g.status === 'confirmed' || g.status === 'completed').length || 0;
      const total = lastHourGroups?.length || 1;
      const conversionRate = (confirmed / total) * 100;

      setLiveMetrics({
        activeNow: activeCount || 0,
        createdLastHour: createdCount || 0,
        conversionRate,
        avgFormationTime: 0, // Could calculate if needed
      });
    };

    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'confirmed': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'completed': return 'Complété';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Activité en Temps Réel
          </h3>
          <p className="text-sm text-muted-foreground">Mise à jour toutes les 5 secondes</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="w-3 h-3" />
          Live
        </Badge>
      </div>

      {/* Live metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Actifs maintenant</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {liveMetrics.activeNow}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-muted-foreground">Dernière heure</span>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {liveMetrics.createdLastHour}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-muted-foreground">Taux conversion</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {liveMetrics.conversionRate.toFixed(0)}%
          </div>
        </div>

        <div className="p-3 rounded-lg bg-secondary">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Temps moy.</span>
          </div>
          <div className="text-2xl font-bold">
            --
          </div>
        </div>
      </div>

      {/* Recent activity feed */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-3">20 Derniers Événements</h4>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-2">
            {recentGroups.map((group) => (
              <div
                key={group.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(group.status)}`} />
                      <span className="text-sm font-medium">{group.location_name || 'Sans localisation'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{getStatusLabel(group.status)}</span>
                      <span>•</span>
                      <span>{group.current_participants} participants</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(group.created_at), { addSuffix: true, locale: fr })}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {format(new Date(group.created_at), 'HH:mm')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
