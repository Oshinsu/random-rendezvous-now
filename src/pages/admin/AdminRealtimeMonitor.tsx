import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Users, Activity } from 'lucide-react';

interface GroupStat {
  id: string;
  status: string;
  current_participants: number;
  max_participants: number;
  updated_at: string;
  location_name?: string;
}

export default function AdminRealtimeMonitor() {
  const [channels, setChannels] = useState<any[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    setIsRefreshing(true);
    
    try {
      // Récupérer les canaux actifs
      const activeChannels = supabase.getChannels();
      setChannels(activeChannels);
      
      // Récupérer les stats de groupes actifs
      const { data, error } = await supabase
        .from('groups')
        .select('id, status, current_participants, max_participants, updated_at, location_name')
        .in('status', ['waiting', 'confirmed'])
        .order('updated_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setGroupStats(data);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur récupération stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh toutes les 5 secondes
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Real-time</h1>
          <p className="text-muted-foreground">
            Surveillance des canaux actifs et des groupes en temps réel
          </p>
        </div>
        <Button 
          onClick={fetchStats} 
          disabled={isRefreshing}
          size="lg"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Canaux Real-time Actifs
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{channels.length}</div>
            <p className="text-xs text-muted-foreground">
              Connexions WebSocket actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Groupes en Attente
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groupStats.filter(g => g.status === 'waiting').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Groupes en formation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Dernière MAJ
            </CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastUpdate.toLocaleTimeString('fr-FR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Mise à jour automatique toutes les 5s
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canaux Real-time Actifs</CardTitle>
          <CardDescription>
            Liste des connexions WebSocket en cours ({channels.length} canaux)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <WifiOff className="mr-2 h-5 w-5" />
              Aucun canal actif
            </div>
          ) : (
            <div className="space-y-2">
              {channels.map((channel, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <code className="text-sm font-mono">
                      {channel.topic}
                    </code>
                  </div>
                  <Badge variant="outline">
                    {channel.state || 'active'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Groupes Actifs</CardTitle>
          <CardDescription>
            Groupes en attente ou confirmés ({groupStats.length} groupes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">ID Groupe</th>
                  <th className="p-3 text-left font-medium">Statut</th>
                  <th className="p-3 text-left font-medium">Participants</th>
                  <th className="p-3 text-left font-medium">Localisation</th>
                  <th className="p-3 text-left font-medium">Dernière MAJ</th>
                </tr>
              </thead>
              <tbody>
                {groupStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Aucun groupe actif
                    </td>
                  </tr>
                ) : (
                  groupStats.map((group) => (
                    <tr key={group.id} className="border-b">
                      <td className="p-3">
                        <code className="text-xs">{group.id.slice(0, 8)}...</code>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(group.status)}>
                          {getStatusLabel(group.status)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {group.current_participants}/{group.max_participants}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {group.location_name || 'Non spécifié'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(group.updated_at).toLocaleTimeString('fr-FR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
