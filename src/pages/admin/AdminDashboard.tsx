import { useState, useEffect } from 'react';
import { useComprehensiveAdminStats } from "@/hooks/useComprehensiveAdminStats";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users, Activity, TrendingUp, DollarSign } from "lucide-react";
import { AlertsBar } from '@/components/admin/dashboard/AlertsBar';
import { KPICards } from '@/components/admin/dashboard/KPICards';
import { RealtimeCharts } from '@/components/admin/dashboard/RealtimeCharts';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';

export const AdminDashboard = () => {
  const { stats, loading, error } = useComprehensiveAdminStats();
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (stats) {
      // Generate system alerts based on stats
      const alerts = [];
      
      if (stats.signups_today > 50) {
        alerts.push({
          id: 'high-signups',
          severity: 'info',
          title: '🎉 High Signup Activity',
          message: `${stats.signups_today} new users today - great traction!`,
          actionUrl: '/admin/users',
          actionLabel: 'View Users',
        });
      }

      if (stats.waiting_groups > 10) {
        alerts.push({
          id: 'waiting-groups',
          severity: 'warning',
          title: '⚠️ Multiple Waiting Groups',
          message: `${stats.waiting_groups} groups are waiting for members`,
          actionUrl: '/admin/groups',
          actionLabel: 'Monitor Groups',
        });
      }

      setSystemAlerts(alerts);
    }
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-destructive">Error loading dashboard stats</div>
    );
  }

  // Mock data for charts (replace with real data)
  const userGrowthData = [
    { date: 'Mon', total_users: stats.total_users - 100, active_users: stats.active_participants - 10 },
    { date: 'Tue', total_users: stats.total_users - 80, active_users: stats.active_participants - 8 },
    { date: 'Wed', total_users: stats.total_users - 60, active_users: stats.active_participants - 5 },
    { date: 'Thu', total_users: stats.total_users - 40, active_users: stats.active_participants - 3 },
    { date: 'Fri', total_users: stats.total_users - 20, active_users: stats.active_participants - 1 },
    { date: 'Sat', total_users: stats.total_users - 10, active_users: stats.active_participants },
    { date: 'Sun', total_users: stats.total_users, active_users: stats.active_participants },
  ];

  const groupStatusData = [
    { name: 'Waiting', value: stats.waiting_groups },
    { name: 'Confirmed', value: stats.confirmed_groups },
    { name: 'Completed', value: stats.completed_groups },
    { name: 'Cancelled', value: stats.cancelled_groups },
  ];

  const apiUsageData = [
    { date: 'Day 1', requests: 1200, costs: 4.5 },
    { date: 'Day 2', requests: 1350, costs: 5.2 },
    { date: 'Day 3', requests: 1100, costs: 4.1 },
    { date: 'Day 4', requests: 1400, costs: 5.8 },
    { date: 'Day 5', requests: 1600, costs: 6.3 },
    { date: 'Day 6', requests: 1250, costs: 4.9 },
    { date: 'Day 7', requests: 1500, costs: 5.5 },
  ];

  const kpiCards = [
    {
      id: 'active-users',
      title: 'Active Users (24h)',
      value: stats.active_participants,
      change: 12,
      trend: 'up' as const,
      icon: <Activity className="h-5 w-5 text-success" />,
    },
    {
      id: 'total-users',
      title: 'Total Users',
      value: stats.total_users,
      change: 8,
      trend: 'up' as const,
      icon: <Users className="h-5 w-5 text-info" />,
    },
    {
      id: 'groups-today',
      title: 'Groups Created Today',
      value: stats.groups_today,
      change: -5,
      trend: 'down' as const,
      icon: <TrendingUp className="h-5 w-5 text-warning" />,
    },
    {
      id: 'avg-group-size',
      title: 'Avg Group Size',
      value: stats.avg_group_size || 0,
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      id: 'completed-groups',
      title: 'Completed Groups',
      value: stats.completed_groups,
      change: 15,
      trend: 'up' as const,
      icon: <TrendingUp className="h-5 w-5 text-success" />,
    },
    {
      id: 'api-costs',
      title: 'API Costs (Est.)',
      value: '$12.50',
      change: 3,
      trend: 'up' as const,
      icon: <DollarSign className="h-5 w-5 text-error" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time overview of your Random platform
        </p>
      </div>

      <AlertsBar alerts={systemAlerts} />
      
      <KPICards kpis={kpiCards} />
      
      <RealtimeCharts 
        userGrowthData={userGrowthData}
        groupStatusData={groupStatusData}
        apiUsageData={apiUsageData}
      />
      
      <QuickActions />
    </div>
  );
};
