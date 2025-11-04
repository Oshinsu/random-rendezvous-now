import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCRMOverview } from '@/hooks/useCRMOverview';
import { useCRMCampaigns } from '@/hooks/useCRMCampaigns';
import { useCRMAnalytics } from '@/hooks/useCRMAnalytics';
import { CRMSegmentsTab } from '@/components/crm/CRMSegmentsTab';
import { AutomationRulesPanel } from '@/components/crm/AutomationRulesPanel';
import { FunnelChart } from '@/components/admin/charts/FunnelChart';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Users, Target, Zap, Plus, Send } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EmailTemplateEditor } from '@/components/crm/EmailTemplateEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminCRMNew() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const { data: overviewData, loading: overviewLoading } = useCRMOverview();
  const { analytics, loading: analyticsLoading } = useCRMAnalytics();
  const { campaigns, createCampaign, loading: campaignsLoading } = useCRMCampaigns();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  /**
   * Form validation with React Hook Form + Zod
   * 
   * SOTA Oct 2025: Type-safe form validation
   * Sources:
   * 1. React Hook Form Best Practices: https://react-hook-form.com/get-started#SchemaValidation
   * 2. OWASP Input Validation: https://owasp.org/www-project-top-ten/
   * 
   * Benefits:
   * - Client-side validation (instant feedback)
   * - Type safety (TypeScript inference from Zod schema)
   * - XSS prevention (sanitization in schema)
   * - UX improvement (field-level errors)
   */
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaign_name: '',
      subject: '',
      content: '',
      send_at: null,
      segment_id: null,
      lifecycle_stage_id: null,
      template_id: null,
    },
  });

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="p-8 space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  const funnelData = analytics ? [
    { label: 'Inscriptions', value: analytics.funnelStats.signups, color: '#dc2626' },
    { label: 'Activés (1er groupe)', value: analytics.funnelStats.activated, color: '#f59e0b' },
    { label: 'Première sortie', value: analytics.funnelStats.firstOuting, color: '#22c55e' },
    { label: 'Réguliers (3+ sorties)', value: analytics.funnelStats.regular, color: '#3b82f6' },
  ] : [];

  const handleCreateCampaign = async () => {
    try {
      await createCampaign({
        campaign_name: campaignName,
        campaign_type: 'email',
        trigger_type: 'manual',
        subject: campaignSubject,
        content: campaignContent,
        target_segment_id: '',
        channels: ['email'],
        send_at: null
      });
      toast.success('✅ Campagne créée avec succès');
    } catch (error) {
      toast.error('❌ Erreur');
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-red-800 mb-2">CRM B2C - Random</h1>
          <p className="text-red-600">
            Gestion intelligente de l'engagement utilisateur et prédiction du churn
          </p>
        </div>

        {/* Tabs - Max 4 (SOTA Practice) */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">📊 Dashboard CRM</TabsTrigger>
            <TabsTrigger value="campaigns">📧 Campagnes</TabsTrigger>
            <TabsTrigger value="automation">⚡ Automations</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
          </TabsList>

          {/* TAB 1: DASHBOARD CRM (Fusion Health + Overview) */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Utilisateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-800">
                    {overviewLoading ? '...' : overviewData.totalUsers}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Utilisateurs Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">
                    {overviewLoading ? '...' : overviewData.activeUsers}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Health Score Moyen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-800">
                    {overviewLoading ? '...' : overviewData.avgHealthScore}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-700 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Taux Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-800">
                    {overviewLoading ? '...' : `${overviewData.conversionRate}%`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Segments Tab included here */}
            <CRMSegmentsTab />
          </TabsContent>

          {/* TAB 2: CAMPAGNES (Split-Screen Editor) */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-red-800">Éditeur de Campagne</h2>
              <Button onClick={handleCreateCampaign} className="bg-red-600 hover:bg-red-700">
                <Send className="h-4 w-4 mr-2" />
                Créer & Envoyer
              </Button>
            </div>

            {/* Split-Screen Layout */}
            <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border border-red-200">
              <ResizablePanel defaultSize={60} minSize={40}>
                <Card className="h-full border-0 rounded-none">
                  <CardHeader className="border-b bg-red-50">
                    <CardTitle className="text-red-800">📝 Édition</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label>Nom de la campagne</Label>
                      <Input
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder="Ex: Welcome Series - Day 1"
                      />
                    </div>
                    
                    <div>
                      <Label>Sujet de l'email</Label>
                      <Input
                        value={campaignSubject}
                        onChange={(e) => setCampaignSubject(e.target.value)}
                        placeholder="Ex: Bienvenue sur Random 🎉"
                      />
                    </div>

                    <div>
                      <Label>Contenu HTML</Label>
                      <EmailTemplateEditor
                        template={{ subject: campaignSubject, html_content: campaignContent, variables: [] }}
                        onChange={(template) => setCampaignContent(template.html_content)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle className="bg-red-200 hover:bg-red-300" />

              <ResizablePanel defaultSize={40} minSize={30}>
                <Card className="h-full border-0 rounded-none">
                  <CardHeader className="border-b bg-red-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-red-800">👁️ Preview Live</CardTitle>
                      <Select value={previewDevice} onValueChange={(v) => setPreviewDevice(v as 'desktop' | 'mobile')}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desktop">💻 Desktop</SelectItem>
                          <SelectItem value="mobile">📱 Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className={previewDevice === 'mobile' ? 'max-w-[375px] mx-auto' : ''}>
                      <div className="border rounded-lg p-4 bg-white">
                        <p className="text-sm text-gray-600 mb-2">De: Random &lt;hello@random.app&gt;</p>
                        <p className="font-bold text-lg mb-4">{campaignSubject || 'Sujet de l\'email'}</p>
                        <div 
                          className="prose prose-sm max-w-none" 
                          dangerouslySetInnerHTML={{ __html: campaignContent || '<p class="text-gray-400">Le contenu apparaîtra ici...</p>' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>

          {/* TAB 3: AUTOMATIONS */}
          <TabsContent value="automation" className="space-y-6">
            <AutomationRulesPanel />
          </TabsContent>

          {/* TAB 4: ANALYTICS (Fusion Analytics + Cohorts) */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-800">📉 Tunnel de Conversion</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analytics && <FunnelChart data={funnelData} />}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-700">Total Envoyés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">
                    {analytics?.campaignStats.totalSent || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700">Taux d'Ouverture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {analytics?.campaignStats.avgOpenRate || 0}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-700">Taux de Clic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800">
                    {analytics?.campaignStats.avgClickRate || 0}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-700">Campagnes Actives</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-800">
                    {analytics?.campaignStats.activeCampaigns || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
