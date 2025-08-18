import { useState } from 'react';
import { useRealTimeActivity } from '@/hooks/useRealTimeActivity';
import { RealtimeChart } from '@/components/admin/RealtimeChart';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  UserPlus,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export const AdminActivity = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('day');
  const { activityEvents, liveStats, chartData, loading, error, refetch } = useRealTimeActivity(selectedPeriod);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user_joined': return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'group_created': return <MapPin className="h-4 w-4 text-green-600" />;
      case 'group_confirmed': return <CheckCircle className="h-4 w-4 text-orange-600" />;
      case 'group_completed': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'message_sent': return <MessageSquare className="h-4 w-4 text-indigo-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'user_joined': return 'bg-blue-50 border-blue-200';
      case 'group_created': return 'bg-green-50 border-green-200';
      case 'group_confirmed': return 'bg-orange-50 border-orange-200';
      case 'group_completed': return 'bg-red-50 border-red-200';
      case 'message_sent': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getEventDescription = (event: typeof activityEvents[0]) => {
    switch (event.type) {
      case 'user_joined':
        return `${event.data.userName} a rejoint un groupe${event.data.location ? ` à ${event.data.location}` : ''}`;
      case 'group_created':
        return `Nouveau groupe créé à ${event.data.location}`;
      case 'group_confirmed':
        return `Groupe confirmé${event.data.barName ? ` au bar ${event.data.barName}` : ''}`;
      case 'group_completed':
        return `Sortie terminée${event.data.barName ? ` au ${event.data.barName}` : ''}`;
      case 'message_sent':
        return `${event.data.userName} a envoyé un message`;
      default:
        return 'Activité inconnue';
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

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Activité en temps réel</h1>
          <p className="text-red-600 mt-2">Surveillance des événements et métriques système</p>
        </div>
        <div className="flex items-center gap-4">
          {selectedPeriod === 'day' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
          )}
          
          {/* Time period selectors */}
          <div className="flex gap-2">
            {([
              { key: 'day', label: 'Jour', icon: Clock },
              { key: 'week', label: 'Semaine', icon: Calendar },
              { key: 'month', label: 'Mois', icon: CalendarDays },
              { key: 'year', label: 'Année', icon: CalendarRange }
            ] as const).map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedPeriod === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(key)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {liveStats?.activeUsers || 0}
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
              {liveStats?.pendingGroups || 0}
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
              {liveStats?.completedGroups || 0}
            </div>
            <p className="text-xs text-green-600">Créés dans les 24h</p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Inscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {liveStats?.signups || 0}
            </div>
            <p className="text-xs text-purple-600">Aujourd'hui</p>
          </CardContent>
        </Card>
        
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-indigo-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-800">
              {liveStats?.messages || 0}
            </div>
            <p className="text-xs text-indigo-600">Dernières 24h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-800">
              Activité - {selectedPeriod === 'day' ? 'Dernières 24h' : 
                         selectedPeriod === 'week' ? 'Dernière semaine' :
                         selectedPeriod === 'month' ? 'Dernier mois' : 'Dernière année'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeChart data={chartData} />
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-800 flex items-center gap-2">
              Événements récents
              <Button onClick={refetch} variant="outline" size="sm">
                Actualiser
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {activityEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border ${getEventColor(event.type)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="font-medium text-gray-800 text-sm">
                        {getEventDescription(event)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
              
              {activityEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune activité récente pour cette période
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
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