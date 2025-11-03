import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/AdminTable";
import { GroupComposition } from "@/components/admin/GroupComposition";
import { GroupsLiveMap } from "@/components/admin/groups/GroupsLiveMap";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MapPin, Users, Clock, CheckCircle, List, Map as MapIcon, Activity } from "lucide-react";
import { Group } from '@/types/database';

interface GroupWithParticipants extends Group {
  participants?: any[];
  created_by_user_id?: string;
}

export default function AdminGroupsNew() {
  const [groups, setGroups] = useState<GroupWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'confirmed' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState('table');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          participants:group_participants(*)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      const allUserIds = new Set<string>();
      groupsData?.forEach(group => {
        group.participants?.forEach(participant => {
          if (participant.user_id) allUserIds.add(participant.user_id);
        });
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', Array.from(allUserIds));

      if (profilesError) throw profilesError;

      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      const enrichedGroups = groupsData?.map(group => ({
        ...group,
        participants: group.participants?.map(participant => ({
          ...participant,
          profiles: profilesMap.get(participant.user_id) || null
        }))
      }));

      setGroups(enrichedGroups as GroupWithParticipants[] || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    fetchGroups();
    
    const channelName = `admin-groups-live-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'groups'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          toast({
            title: "🆕 Nouveau groupe créé",
            description: `${(payload.new as any).location_name}`,
          });
        }
        fetchGroups();
      })
      .subscribe();
      
    return () => {
      // ✅ SOTA 2025: unsubscribe avant removeChannel
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: MapPin },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-300', icon: Clock }
    };
    
    const config = variants[status as keyof typeof variants] || variants.waiting;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const filteredGroups = groups.filter(group => 
    filter === 'all' || group.status === filter
  );

  const columns = [
    {
      header: "Statut",
      accessor: "status" as keyof GroupWithParticipants,
      render: (value: string) => getStatusBadge(value)
    },
    {
      header: "Participants",
      accessor: "current_participants" as keyof GroupWithParticipants,
      render: (value: number, row: GroupWithParticipants) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {value}/{row.max_participants}
        </div>
      )
    },
    {
      header: "Composition",
      accessor: "participants" as keyof GroupWithParticipants,
      render: (participants: any[], row: GroupWithParticipants) => (
        <GroupComposition
          participants={participants || []}
          createdByUserId={row.created_by_user_id}
          createdAt={row.created_at}
        />
      )
    },
    {
      header: "Zone",
      accessor: "location_name" as keyof GroupWithParticipants,
    },
    {
      header: "Bar",
      accessor: "bar_name" as keyof GroupWithParticipants,
      render: (value: string) => value || "Aucun"
    },
    {
      header: "Créé le",
      accessor: "created_at" as keyof GroupWithParticipants,
      render: (value: string) => new Date(value).toLocaleDateString('fr-FR')
    }
  ];

  const activeGroups = groups.filter(g => ['waiting', 'confirmed'].includes(g.status));

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-red-800">Gestion des Groupes</h1>
            <p className="text-red-600">Supervision et modération en temps réel</p>
          </div>
          <Button onClick={fetchGroups} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
            <Activity className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-700">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-800">
                {groups.filter(g => g.status === 'waiting').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">Confirmés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">
                {groups.filter(g => g.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700">Terminés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">
                {groups.filter(g => g.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700">Total actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">
                {activeGroups.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ SOTA 2025: Real-time Monitoring Enhancement */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monitoring Groupes en Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Groupes actifs maintenant</div>
                <div className="text-2xl font-bold text-purple-800">
                  {activeGroups.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Participants en ligne</div>
                <div className="text-2xl font-bold text-purple-800">
                  {activeGroups.reduce((sum, g) => sum + (g.current_participants || 0), 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Table / Map / Realtime */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">
              <List className="h-4 w-4 mr-2" />
              📋 Liste
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapIcon className="h-4 w-4 mr-2" />
              🗺️ Carte Live
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              {(['all', 'waiting', 'confirmed', 'completed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                  className={filter === status ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'}
                >
                  {status === 'all' ? 'Tous' : 
                   status === 'waiting' ? 'En attente' :
                   status === 'confirmed' ? 'Confirmés' : 
                   'Terminés'}
                </Button>
              ))}
            </div>

            <AdminTable
              data={filteredGroups}
              columns={columns}
              searchKey="location_name"
              searchPlaceholder="Rechercher par zone..."
            />
          </TabsContent>

          <TabsContent value="map">
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <MapIcon className="h-5 w-5" />
                  Groupes Actifs en Temps Réel
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    {activeGroups.length} actifs
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <GroupsLiveMap
                    groups={activeGroups as any}
                    onGroupClick={(group: any) => {
                      toast({
                        title: group.location_name,
                        description: `${group.current_participants} participants`,
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
