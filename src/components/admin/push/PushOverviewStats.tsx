import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushAnalytics } from '@/hooks/usePushAnalytics';
import { TrendingUp, TrendingDown, Bell, Eye, Send, Users } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { NotificationControlCenter } from './NotificationControlCenter';

export const PushOverviewStats = () => {
  const { data, isLoading } = usePushAnalytics('month');

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Permission Acceptance',
      value: `${data?.permissionRate || 0}%`,
      icon: Bell,
      target: 60,
      description: 'Taux d\'acceptation push',
      color: (data?.permissionRate || 0) >= 50 ? 'text-green-600' : (data?.permissionRate || 0) >= 30 ? 'text-orange-600' : 'text-red-600',
    },
    {
      title: 'Open Rate Moyen',
      value: `${data?.openRate || 0}%`,
      icon: Eye,
      target: 40,
      description: '30 derniers jours',
      sparkline: data?.sparklineData || [],
      color: (data?.openRate || 0) >= 35 ? 'text-green-600' : (data?.openRate || 0) >= 25 ? 'text-orange-600' : 'text-red-600',
    },
    {
      title: 'Total Envoyées',
      value: data?.totalSent || 0,
      icon: Send,
      description: '30 derniers jours',
      change: data?.percentChange || 0,
      color: 'text-primary',
    },
    {
      title: 'Tokens Actifs',
      value: data?.activeTokens || 0,
      icon: Users,
      description: 'Devices enregistrés',
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: KPIs Globaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  {stat.change !== undefined && (
                    <span className={`text-xs flex items-center ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
                {stat.sparkline && stat.sparkline.length > 0 && (
                  <div className="h-12 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stat.sparkline.map((value, index) => ({ value, index }))}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {stat.target && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: {stat.target}%
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section 2: Notification Control Center */}
      <NotificationControlCenter />
    </div>
  );
};
