import { useState, useEffect } from 'react';
import { useRealAdminDashboard } from "@/hooks/useRealAdminDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, Activity, TrendingUp, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { AlertsBar } from '@/components/admin/dashboard/AlertsBar';
import { KPICards } from '@/components/admin/dashboard/KPICards';
import { RealtimeCharts } from '@/components/admin/dashboard/RealtimeCharts';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export const AdminDashboard = () => {
  const { 
    stats, 
    userGrowth, 
    hourlyActivity, 
    barPerformance, 
    conversionFunnel,
    apiCosts,
    isLoading,
    refreshViews 
  } = useRealAdminDashboard();
  
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (stats && typeof stats === 'object' && !Array.isArray(stats)) {
      const alerts = [];
      const statsObj = stats as any;
      
      if (statsObj.signups_today > 50) {
        alerts.push({
          id: 'high-signups',
          severity: 'info',
          title: '🎉 Strong Signup Activity',
          message: `${statsObj.signups_today} new users today - excellent growth momentum!`,
          actionUrl: '/admin/users',
          actionLabel: 'View Users',
        });
      }

      if (statsObj.waiting_groups > 10) {
        alerts.push({
          id: 'waiting-groups',
          severity: 'warning',
          title: '⚠️ Multiple Waiting Groups',
          message: `${statsObj.waiting_groups} groups waiting for members - engagement opportunity`,
          actionUrl: '/admin/groups',
          actionLabel: 'Monitor Groups',
        });
      }

      if (statsObj.active_participants > 100) {
        alerts.push({
          id: 'high-activity',
          severity: 'info',
          title: '🔥 Peak Activity Detected',
          message: `${statsObj.active_participants} active users in the last 24h - platform momentum`,
          actionUrl: '/admin/activity',
          actionLabel: 'View Activity',
        });
      }

      setSystemAlerts(alerts);
    }
  }, [stats]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate trends from real data
  const statsObj = (stats && typeof stats === 'object' && !Array.isArray(stats)) ? stats as any : null;
  const latestActivity = hourlyActivity[0];
  const previousActivity = hourlyActivity[1];
  
  const activeUsersTrend = previousActivity ? 
    Math.round(((latestActivity?.active_users || 0) - (previousActivity?.active_users || 0)) / Math.max(previousActivity.active_users, 1) * 100) : 0;
  
  const groupsTodayTrend = statsObj?.groups_today > 0 ? 
    Math.round((statsObj.groups_today / Math.max(statsObj.total_users / 100, 1)) * 10) : 0;

  const totalCostToday = apiCosts.length > 0 ? apiCosts[apiCosts.length - 1]?.total_cost || 0 : 0;

  const kpiCards = [
    {
      id: 'active-users',
      title: 'Active Users (24h)',
      value: statsObj?.active_participants || 0,
      change: activeUsersTrend,
      trend: activeUsersTrend >= 0 ? 'up' as const : 'down' as const,
      icon: <Activity className="h-5 w-5 text-success" />,
    },
    {
      id: 'total-users',
      title: 'Total Users',
      value: statsObj?.total_users || 0,
      change: Math.round((statsObj?.signups_today || 0 / Math.max(statsObj?.total_users || 1, 1)) * 100),
      trend: 'up' as const,
      icon: <Users className="h-5 w-5 text-info" />,
    },
    {
      id: 'groups-today',
      title: 'Groups Created Today',
      value: statsObj?.groups_today || 0,
      change: groupsTodayTrend,
      trend: groupsTodayTrend >= 0 ? 'up' as const : 'down' as const,
      icon: <TrendingUp className="h-5 w-5 text-warning" />,
    },
    {
      id: 'avg-group-size',
      title: 'Avg Group Size',
      value: statsObj?.avg_group_size?.toFixed(1) || '0',
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      id: 'completed-groups',
      title: 'Completed Groups',
      value: statsObj?.completed_groups || 0,
      change: Math.round((statsObj?.completed_groups || 0) / Math.max((statsObj?.confirmed_groups || 0) + (statsObj?.completed_groups || 0), 1) * 100),
      trend: 'up' as const,
      icon: <CheckCircle className="h-5 w-5 text-success" />,
    },
    {
      id: 'api-costs',
      title: 'API Costs Today',
      value: `$${totalCostToday.toFixed(2)}`,
      change: apiCosts.length > 1 ? Math.round(((totalCostToday - (apiCosts[apiCosts.length - 2]?.total_cost || 0)) / Math.max(apiCosts[apiCosts.length - 2]?.total_cost || 1, 0.01)) * 100) : 0,
      trend: 'up' as const,
      icon: <DollarSign className="h-5 w-5 text-error" />,
    },
  ];

  // Transform real data for charts
  const userGrowthChartData = userGrowth.map(day => ({
    date: format(new Date(day.date), 'EEE'),
    total_users: day.total_users,
    new_users: day.new_users,
  }));

  const groupStatusData = [
    { name: 'Waiting', value: statsObj?.waiting_groups || 0, fill: 'hsl(var(--warning))' },
    { name: 'Confirmed', value: statsObj?.confirmed_groups || 0, fill: 'hsl(var(--info))' },
    { name: 'Completed', value: statsObj?.completed_groups || 0, fill: 'hsl(var(--success))' },
    { name: 'Cancelled', value: statsObj?.cancelled_groups || 0, fill: 'hsl(var(--muted))' },
  ];

  const apiUsageChartData = apiCosts.map(day => ({
    date: format(new Date(day.date), 'MMM dd'),
    requests: day.total_requests,
    cost: parseFloat(day.total_cost?.toFixed(2) || '0'),
    errors: day.errors,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time platform analytics • Last updated: {format(new Date(), 'HH:mm:ss')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={refreshViews}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <AlertsBar alerts={systemAlerts} />
      
      <KPICards kpis={kpiCards} />
      
      <RealtimeCharts 
        userGrowthData={userGrowthChartData}
        groupStatusData={groupStatusData}
        apiUsageData={apiUsageChartData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Conversion Funnel (30d)
            </CardTitle>
            <CardDescription>User journey from signup to completed outing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.map((stage, idx) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{stage.count}</Badge>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {stage.conversion_rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-500"
                      style={{ width: `${stage.conversion_rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Bars */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Top Bars (30d)
            </CardTitle>
            <CardDescription>Most popular venues for Random outings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {barPerformance.slice(0, 5).map((bar, idx) => (
                <div key={bar.bar_name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center">
                      {idx + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{bar.bar_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg {bar.avg_group_size?.toFixed(1)} people • {bar.days_active} days active
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{bar.total_visits} visits</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <QuickActions />
    </div>
  );
};
