import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminTable } from '@/components/admin/AdminTable';
import { RefreshCw, Users, Clock, TrendingUp, MapPin, BarChart3, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminGroupsAnalytics } from '@/hooks/useAdminGroupsAnalytics';
import { GroupsTimelineChart } from '@/components/admin/groups/GroupsTimelineChart';
import { GroupsGeographicMap } from '@/components/admin/groups/GroupsGeographicMap';
import { GroupsTemporalHeatmap } from '@/components/admin/groups/GroupsTemporalHeatmap';
import { GroupsFunnelChart } from '@/components/admin/groups/GroupsFunnelChart';
import { GroupsRealtimeActivity } from '@/components/admin/groups/GroupsRealtimeActivity';
import { GroupsInsightsPanel } from '@/components/admin/groups/GroupsInsightsPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GroupWithParticipants {
  id: string;
  status: string;
  current_participants: number;
  max_participants: number;
  location_name: string | null;
  bar_name: string | null;
  created_at: string;
  participants?: any[];
}

export const AdminGroups = () => {
  const [groups, setGroups] = useState<GroupWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { analytics, loading: analyticsLoading, refreshAnalytics } = useAdminGroupsAnalytics();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          participants:group_participants(
            user_id,
            status,
            last_seen,
            profiles(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erreur lors du chargement des groupes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();

    // Create a unique channel instance to prevent duplicate subscriptions
    const channelName = `admin-groups-changes-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        fetchGroups();
        toast.info('Nouveau groupe créé', { duration: 2000 });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    fetchGroups();
    refreshAnalytics();
    toast.success('Données actualisées');
  };

  const filteredGroups = filter === 'all' 
    ? groups 
    : groups.filter(g => g.status === filter);

  const activeGroups = groups.filter(g => g.status === 'waiting' || g.status === 'confirmed');

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: { label: 'En attente', color: 'bg-yellow-500' },
      confirmed: { label: 'Confirmé', color: 'bg-green-500' },
      completed: { label: 'Complété', color: 'bg-blue-500' },
      cancelled: { label: 'Annulé', color: 'bg-red-500' },
    };
    const variant = variants[status as keyof typeof variants] || { label: status, color: 'bg-gray-500' };
    return (
      <Badge className={`${variant.color} text-white`}>
        {variant.label}
      </Badge>
    );
  };

  // Calculate KPIs
  const totalGroups = groups.length;
  const waitingGroups = groups.filter(g => g.status === 'waiting').length;
  const confirmedGroups = groups.filter(g => g.status === 'confirmed').length;
  const completedGroups = groups.filter(g => g.status === 'completed').length;
  const cancelledGroups = groups.filter(g => g.status === 'cancelled').length;
  const avgParticipants = groups.length > 0 
    ? (groups.reduce((sum, g) => sum + g.current_participants, 0) / groups.length).toFixed(1)
    : '0';
  const conversionRate = totalGroups > 0
    ? ((completedGroups / totalGroups) * 100).toFixed(1)
    : '0';
  const uniqueLocations = new Set(groups.map(g => g.location_name).filter(Boolean)).size;

  const columns = [
    { header: 'ID', accessor: 'id' as keyof GroupWithParticipants, render: (val: any, row: GroupWithParticipants) => row.id.slice(0, 8) },
    { header: 'Statut', accessor: 'status' as keyof GroupWithParticipants, render: (val: any, row: GroupWithParticipants) => getStatusBadge(row.status) },
    { header: 'Zone', accessor: 'location_name' as keyof GroupWithParticipants, render: (val: any) => val || '-' },
    { header: 'Participants', accessor: 'current_participants' as keyof GroupWithParticipants, render: (val: any, row: GroupWithParticipants) => `${row.current_participants}/${row.max_participants}` },
    { header: 'Bar', accessor: 'bar_name' as keyof GroupWithParticipants, render: (val: any) => val || '-' },
    { header: 'Créé', accessor: 'created_at' as keyof GroupWithParticipants, render: (val: any) => new Date(val).toLocaleString('fr-FR') },
  ];

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Groupes</h1>
          <p className="text-muted-foreground">Dashboard SOTA 2025</p>
        </div>
        {/* Header avec actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} disabled={loading || analyticsLoading} size="sm" variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading || analyticsLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                <SelectItem value="waiting">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmés</SelectItem>
                <SelectItem value="completed">Complétés</SelectItem>
                <SelectItem value="cancelled">Annulés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="text-sm">
            Données en temps réel
          </Badge>
        </div>

        {/* 6 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Groupes Actifs</p>
                <p className="text-3xl font-bold text-primary">{activeGroups.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {waitingGroups} en attente • {confirmedGroups} confirmés
                </p>
              </div>
              <Users className="w-10 h-10 text-primary/20" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux Conversion</p>
                <p className="text-3xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedGroups} complétés / {totalGroups} créés
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500/20" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participants Moy.</p>
                <p className="text-3xl font-bold">{avgParticipants}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur {totalGroups} groupes
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500/20" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Zones Couvertes</p>
                <p className="text-3xl font-bold">{uniqueLocations}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Villes actives
                </p>
              </div>
              <MapPin className="w-10 h-10 text-purple-500/20" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Groupes Annulés</p>
                <p className="text-3xl font-bold text-red-500">{cancelledGroups}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalGroups > 0 ? ((cancelledGroups / totalGroups) * 100).toFixed(1) : 0}% du total
                </p>
              </div>
              <Clock className="w-10 h-10 text-red-500/20" />
            </div>
          </Card>

          <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Groupes</p>
                <p className="text-3xl font-bold">{totalGroups}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Toutes périodes
                </p>
              </div>
              <BarChart3 className="w-10 h-10 text-gray-500/20" />
            </div>
          </Card>
        </div>

        {/* Timeline + Real-time Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GroupsTimelineChart data={analytics.timeline} />
          <GroupsRealtimeActivity />
        </div>

        {/* Insights Panel */}
        <GroupsInsightsPanel 
          geographic={analytics.geographic}
          heatmap={analytics.heatmap}
          funnel={analytics.funnel}
        />

        {/* Tabs avec visualisations */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="geographic">Géographique</TabsTrigger>
            <TabsTrigger value="temporal">Patterns Temps</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Table des Groupes</h3>
                <Badge variant="secondary">{filteredGroups.length} résultats</Badge>
              </div>
              <AdminTable
                data={filteredGroups}
                columns={columns}
              />
            </Card>
          </TabsContent>

          <TabsContent value="geographic">
            <GroupsGeographicMap data={analytics.geographic} />
          </TabsContent>

          <TabsContent value="temporal">
            <GroupsTemporalHeatmap data={analytics.heatmap} />
          </TabsContent>

          <TabsContent value="funnel">
            <GroupsFunnelChart data={analytics.funnel} />
          </TabsContent>
        </Tabs>
      </div>
  );
}
