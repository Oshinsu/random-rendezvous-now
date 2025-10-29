import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PushOverviewStats } from '@/components/admin/push/PushOverviewStats';
import { PushNotificationsTable } from '@/components/admin/push/PushNotificationsTable';
import { PushAnalyticsCharts } from '@/components/admin/push/PushAnalyticsCharts';
import { PushSettings } from '@/components/admin/push/PushSettings';
import { Bell } from 'lucide-react';

export default function AdminPushNotifications() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Push Notifications</h1>
            <p className="text-muted-foreground">Gérez et optimisez vos notifications push</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PushOverviewStats />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <PushNotificationsTable />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PushAnalyticsCharts />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <PushSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
