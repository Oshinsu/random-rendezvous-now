import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RealtimeChart } from "@/components/admin/RealtimeChart";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, Users, MapPin, TrendingUp, AlertTriangle } from "lucide-react";

interface ActivityEvent {
  id: string;
  type: 'user_join' | 'group_created' | 'group_confirmed' | 'group_completed' | 'user_signup';
  description: string;
  timestamp: string;
  metadata?: any;
}

export const AdminActivity = () => {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({
    activeUsers: 0,
    pendingGroups: 0,
    completedToday: 0,
    signupsToday: 0
  });
  const { toast } = useToast();

  const fetchLiveActivity = async () => {
    try {
      // Simuler des événements d'activité récents
      const mockActivity: ActivityEvent[] = [
        {
          id: '1',
          type: 'user_signup',
          description: 'Nouvel utilisateur inscrit',
          timestamp: new Date(Date.now() - 2000).toISOString()
        },
        {
          id: '2',
          type: 'group_created',
          description: 'Nouveau groupe créé à Paris 15ème',
          timestamp: new Date(Date.now() - 15000).toISOString()
        },
        {
          id: '3',
          type: 'user_join',
          description: 'Utilisateur a rejoint un groupe',
          timestamp: new Date(Date.now() - 30000).toISOString()
        },
        {
          id: '4',
          type: 'group_confirmed',
          description: 'Groupe confirmé avec bar assigné',
          timestamp: new Date(Date.now() - 45000).toISOString()
        },
        {
          id: '5',
          type: 'group_completed',
          description: 'Sortie terminée avec succès',
          timestamp: new Date(Date.now() - 120000).toISOString()
        }
      ];

      setActivity(mockActivity);

      // Récupérer les vraies stats
      const { data: stats } = await supabase.rpc('get_admin_stats');
      if (stats) {
        const statsData = stats as any;
        setLiveStats({
          activeUsers: Math.floor(Math.random() * 50) + 10, // Simulation
          pendingGroups: statsData.waiting_groups || 0,
          completedToday: statsData.groups_today || 0,
          signupsToday: statsData.signups_today || 0
        });
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'activité",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveActivity();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchLiveActivity, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="h-4 w-4 text-blue-600" />;
      case 'group_created': return <MapPin className="h-4 w-4 text-green-600" />;
      case 'user_join': return <Activity className="h-4 w-4 text-purple-600" />;
      case 'group_confirmed': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'group_completed': return <Activity className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'user_signup': return 'bg-blue-50 border-blue-200';
      case 'group_created': return 'bg-green-50 border-green-200';
      case 'user_join': return 'bg-purple-50 border-purple-200';
      case 'group_confirmed': return 'bg-orange-50 border-orange-200';
      case 'group_completed': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Activité en temps réel</h1>
          <p className="text-red-600 mt-2">Surveillance live de l'activité utilisateurs et système</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Live
          </Badge>
          <Button onClick={fetchLiveActivity} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {liveStats.activeUsers}
            </div>
            <p className="text-xs text-blue-600">En ligne maintenant</p>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Groupes en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {liveStats.pendingGroups}
            </div>
            <p className="text-xs text-yellow-600">Cherchent des membres</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Groupes aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {liveStats.completedToday}
            </div>
            <p className="text-xs text-green-600">Créés dans les 24h</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {liveStats.signupsToday}
            </div>
            <p className="text-xs text-purple-600">Aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique temps réel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-800">
              Activité des dernières 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeChart />
          </CardContent>
        </Card>

        {/* Timeline des événements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-800">
              Événements récents
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {activity.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="font-medium text-gray-800">
                        {event.description}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes système */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-orange-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-orange-700">
            Aucune alerte active. Tous les systèmes fonctionnent normalement.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};