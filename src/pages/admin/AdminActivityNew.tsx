import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useRealTimeActivity } from '@/hooks/useRealTimeActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { 
  Users, 
  Activity, 
  MessageSquare, 
  MapPin,
  Calendar as CalendarIcon,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export default function AdminActivityNew() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('day');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date()
  });
  
  const { activityEvents, liveStats, chartData, loading } = useRealTimeActivity(selectedPeriod);

  // Auto-refresh in day mode
  useEffect(() => {
    if (selectedPeriod === 'day') {
      const interval = setInterval(() => {
        window.location.reload();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedPeriod]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user_joined': return <Users className="h-4 w-4 text-blue-600" />;
      case 'group_created': return <MapPin className="h-4 w-4 text-green-600" />;
      case 'group_confirmed': return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'message_sent': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const eventTypeDistribution = [
    { name: 'Groupes créés', value: activityEvents.filter(e => e.type === 'group_created').length, color: '#22c55e' },
    { name: 'Utilisateurs rejoints', value: activityEvents.filter(e => e.type === 'user_joined').length, color: '#3b82f6' },
    { name: 'Groupes confirmés', value: activityEvents.filter(e => e.type === 'group_confirmed').length, color: '#f59e0b' },
    { name: 'Messages', value: activityEvents.filter(e => e.type === 'message_sent').length, color: '#a855f7' },
  ];

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-red-800">Activité en Temps Réel</h1>
            <p className="text-red-600">Surveillance des événements et métriques système</p>
          </div>
          <div className="flex items-center gap-4">
            {selectedPeriod === 'day' && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live
              </Badge>
            )}
            
            {/* Period Filters */}
            <div className="flex gap-2">
              {([
                { key: 'day', label: 'Jour' },
                { key: 'week', label: 'Semaine' },
                { key: 'month', label: 'Mois' }
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedPeriod === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(key)}
                  className={selectedPeriod === key ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Utilisateurs actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">
                {liveStats?.activeUsers || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Groupes créés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800">
                {liveStats?.completedGroups || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">
                {liveStats?.messages || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Inscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800">
                {liveStats?.signups || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Timeline */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800">Activité - {selectedPeriod === 'day' ? 'Dernières 24h' : 'Historique'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
                  <XAxis dataKey="time" stroke="#991b1b" />
                  <YAxis stroke="#991b1b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #fecaca',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Event Type Distribution */}
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800">Répartition par Type</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {eventTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events - Interactive */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-800">Événements Récents</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {activityEvents.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-red-200 hover:bg-red-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="font-medium text-sm">
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
