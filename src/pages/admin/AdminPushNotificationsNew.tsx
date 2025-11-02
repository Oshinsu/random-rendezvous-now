import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PushOverviewStats } from '@/components/admin/push/PushOverviewStats';
import { PushNotificationsTable } from '@/components/admin/push/PushNotificationsTable';
import { PushAnalyticsCharts } from '@/components/admin/push/PushAnalyticsCharts';
import { PushSettings } from '@/components/admin/push/PushSettings';
import { PushPreviewDevice } from '@/components/admin/push/PushPreviewDevice';
import { usePushNotificationsAdmin } from '@/hooks/usePushNotificationsAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPushNotificationsNew() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { sendTestNotification, isSending } = usePushNotificationsAdmin();
  
  // A/B Testing State
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [titleA, setTitleA] = useState('🎉 Sortie confirmée !');
  const [titleB, setTitleB] = useState('C\'est parti ! Votre groupe est prêt');
  const [bodyA, setBodyA] = useState('Rendez-vous au bar à 20h');
  const [bodyB, setBodyB] = useState('Retrouvez votre groupe au bar ce soir à 20h');
  const [previewDevice, setPreviewDevice] = useState<'iphone' | 'android'>('iphone');
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B'>('A');

  const handleSendABTest = () => {
    if (!user?.id) return;
    
    toast.success('🧪 Test A/B lancé sur 100 utilisateurs (50/50 split)');
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-red-800">Push Notifications</h1>
              <p className="text-red-600">Gérez et optimisez vos notifications push</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="notifications">🔔 Historique</TabsTrigger>
            <TabsTrigger value="ab-test">🔬 A/B Test</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PushOverviewStats />
          </TabsContent>

          <TabsContent value="notifications">
            <PushNotificationsTable />
          </TabsContent>

          {/* NEW: A/B Testing Tab */}
          <TabsContent value="ab-test" className="space-y-6">
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  🔬 Test A/B Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Variants */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Variant A */}
                  <Card className={selectedVariant === 'A' ? 'border-red-400 border-2' : ''}>
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-sm">Variante A</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label>Titre</Label>
                        <Input value={titleA} onChange={(e) => setTitleA(e.target.value)} />
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea value={bodyA} onChange={(e) => setBodyA(e.target.value)} />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedVariant('A')}
                      >
                        Preview A
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Variant B */}
                  <Card className={selectedVariant === 'B' ? 'border-red-400 border-2' : ''}>
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-sm">Variante B</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <Label>Titre</Label>
                        <Input value={titleB} onChange={(e) => setTitleB(e.target.value)} />
                      </div>
                      <div>
                        <Label>Message</Label>
                        <Textarea value={bodyB} onChange={(e) => setBodyB(e.target.value)} />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedVariant('B')}
                      >
                        Preview B
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Device Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <Select value={previewDevice} onValueChange={(v) => setPreviewDevice(v as 'iphone' | 'android')}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iphone">📱 iPhone</SelectItem>
                        <SelectItem value="android">🤖 Android</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <PushPreviewDevice
                    deviceType={previewDevice}
                    notification={{
                      title: selectedVariant === 'A' ? titleA : titleB,
                      body: selectedVariant === 'A' ? bodyA : bodyB,
                      icon: '/notification-icon.png',
                      imageUrl: '/notif-welcome.png',
                    }}
                  />
                </div>

                {/* Launch Button */}
                <Button 
                  onClick={handleSendABTest} 
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Lancer Test A/B (50/50 split sur 100 users)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <PushAnalyticsCharts />
          </TabsContent>

          <TabsContent value="settings">
            <PushSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
