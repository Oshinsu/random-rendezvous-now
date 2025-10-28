import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, BarChart3, MessageSquare, TestTube, Calendar, UserCheck, Activity, Download, Plus } from 'lucide-react';
import { CRMFilters } from '@/components/crm/CRMFilters';
import { CohortAnalysis } from '@/components/crm/CohortAnalysis';
import { ABTestingPanel } from '@/components/crm/ABTestingPanel';
import { FeedbackPanel } from '@/components/crm/FeedbackPanel';
import { CampaignCalendar } from '@/components/crm/CampaignCalendar';
import { EmailTemplateEditor } from '@/components/crm/EmailTemplateEditor';
import { TemplateSelector } from '@/components/crm/TemplateSelector';
import { QuickCampaignModal } from '@/components/crm/QuickCampaignModal';
import { SequenceBuilder } from '@/components/crm/SequenceBuilder';
import { AISuggestionsPanel } from '@/components/crm/AISuggestionsPanel';
import { CampaignStatsWidget } from '@/components/crm/CampaignStatsWidget';
import { useCRMSequences } from '@/hooks/useCRMSequences';
import { getTemplateById } from '@/data/campaignTemplateLibrary';
import { CRMOverview } from '@/components/crm/CRMOverview';
import { CRMSegmentsTab } from '@/components/crm/CRMSegmentsTab';
import { AutomationRulesPanel } from '@/components/crm/AutomationRulesPanel';
import { useCRMAnalytics } from '@/hooks/useCRMAnalytics';
import { useCRMOverview } from '@/hooks/useCRMOverview';
import { useCRMSegments } from '@/hooks/useCRMSegments';
import { useCRMHealth } from '@/hooks/useCRMHealth';
import { useCRMCampaigns } from '@/hooks/useCRMCampaigns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { HealthScoreTable } from '@/components/crm/HealthScoreTable';

export default function AdminCRM() {
  const [churnRiskFilter, setChurnRiskFilter] = useState<string | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginStatusFilter, setLoginStatusFilter] = useState<string | null>(null);
  const [healthPage, setHealthPage] = useState(1);
  const healthPageSize = 50;

  const { analytics, loading: analyticsLoading } = useCRMAnalytics();
  const { data: overviewData, loading: overviewLoading } = useCRMOverview();
  const { segments } = useCRMSegments();
  const { 
    healthScores, 
    stats: healthStats, 
    loading: healthLoading, 
    totalCount,
    totalPages,
    currentPage,
    calculateAllScores 
  } = useCRMHealth(
    churnRiskFilter,
    segmentFilter,
    searchQuery,
    healthPage,
    healthPageSize
  );
  const { campaigns, loading: campaignsLoading, createCampaign, sendCampaign } = useCRMCampaigns();

  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_type: 'email' as const,
    trigger_type: 'manual' as const,
    subject: '',
    content: '',
    target_segment_id: '',
    channels: ['email'] as string[]
  });
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalDate, setQuickModalDate] = useState<Date>();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSequences, setShowSequences] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const { sequences, createSequence } = useCRMSequences();
  const [calculatingHealth, setCalculatingHealth] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: '',
    html_content: '',
    variables: [] as string[]
  });

  const handleCalculateHealth = async () => {
    setCalculatingHealth(true);
    try {
      await calculateAllScores();
      toast({
        title: 'Calcul terminé',
        description: 'Les health scores ont été mis à jour'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de calculer les health scores',
        variant: 'destructive'
      });
    } finally {
      setCalculatingHealth(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      // Copy email template to campaign before creating
      await createCampaign({
        ...newCampaign,
        subject: emailTemplate.subject,
        content: emailTemplate.html_content
      });
      setNewCampaign({
        campaign_name: '',
        campaign_type: 'email',
        trigger_type: 'manual',
        subject: '',
        content: '',
        target_segment_id: '',
        channels: ['email']
      });
      setEmailTemplate({
        subject: '',
        html_content: '',
        variables: []
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Prénom', 'Nom', 'Health Score', 'Churn Risk', 'Total Outings', 'Last Activity'].join(','),
      ...healthScores.map(item => [
        item.profile?.email || '',
        item.profile?.first_name || '',
        item.profile?.last_name || '',
        item.health_score,
        item.churn_risk,
        item.total_outings,
        item.last_activity_at || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-export-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">CRM B2C - Random</h1>
          <p className="text-muted-foreground">
            Gestion intelligente de l'engagement utilisateur et prédiction du churn
          </p>
        </div>

        {/* Overview Cards */}
        <CRMOverview
          totalUsers={overviewData.totalUsers}
          activeUsers={overviewData.activeUsers}
          avgHealthScore={overviewData.avgHealthScore}
          criticalRisk={overviewData.criticalRisk}
          highRisk={overviewData.highRisk}
          conversionRate={overviewData.conversionRate}
          loading={overviewLoading}
        />

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-8 gap-1">
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="segments">👥 Segments</TabsTrigger>
            <TabsTrigger value="health">💚 Health</TabsTrigger>
            <TabsTrigger value="campaigns">📧 Campagnes</TabsTrigger>
            <TabsTrigger value="automation">⚡ Automation</TabsTrigger>
            <TabsTrigger value="feedback">💬 Feedbacks</TabsTrigger>
            <TabsTrigger value="cohorts">📈 Cohortes</TabsTrigger>
            <TabsTrigger value="ab-testing">🧪 A/B Tests</TabsTrigger>
          </TabsList>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Funnel de Conversion</h3>
              {analytics && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>1. Inscriptions</span>
                      <span className="font-bold">{analytics.funnelStats.signups}</span>
                    </div>
                    <Progress value={100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>2. Activés (1er groupe)</span>
                      <span className="font-bold">{analytics.funnelStats.activated}</span>
                    </div>
                    <Progress value={(analytics.funnelStats.activated / analytics.funnelStats.signups) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>3. Première sortie</span>
                      <span className="font-bold">{analytics.funnelStats.firstOuting}</span>
                    </div>
                    <Progress value={(analytics.funnelStats.firstOuting / analytics.funnelStats.signups) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>4. Réguliers (3+ sorties)</span>
                      <span className="font-bold">{analytics.funnelStats.regular}</span>
                    </div>
                    <Progress value={(analytics.funnelStats.regular / analytics.funnelStats.signups) * 100} />
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Performance des Campagnes</h3>
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Envoyés</p>
                    <p className="text-2xl font-bold">{analytics.campaignStats.totalSent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux d'Ouverture</p>
                    <p className="text-2xl font-bold">{analytics.campaignStats.avgOpenRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de Clic</p>
                    <p className="text-2xl font-bold">{analytics.campaignStats.avgClickRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Campagnes Actives</p>
                    <p className="text-2xl font-bold">{analytics.campaignStats.activeCampaigns}</p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* SEGMENTS TAB */}
          <TabsContent value="segments" className="space-y-6">
            <CRMSegmentsTab />
          </TabsContent>

          {/* HEALTH SCORES TAB */}
          <TabsContent value="health" className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Health Scores Utilisateurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Score moyen: <span className="font-semibold">{healthStats.avgHealthScore}/100</span> • 
                    <span className="font-semibold ml-1">{totalCount}</span> utilisateurs • 
                    <span className="ml-1">Page {currentPage}/{totalPages}</span>
                  </p>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="destructive">{healthStats.criticalRisk} critiques</Badge>
                    <Badge variant="destructive">{healthStats.highRisk} élevés</Badge>
                    <Badge variant="secondary">{healthStats.mediumRisk} moyens</Badge>
                    <Badge variant="default">{healthStats.lowRisk} faibles</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button onClick={handleCalculateHealth} disabled={calculatingHealth}>
                    <Activity className="mr-2 h-4 w-4" />
                    {calculatingHealth ? 'Calcul...' : 'Recalculer Tous'}
                  </Button>
                </div>
              </div>

              <CRMFilters
                churnRiskFilter={churnRiskFilter}
                onChurnRiskChange={(value) => {
                  setChurnRiskFilter(value);
                  setHealthPage(1);
                }}
                segmentFilter={segmentFilter}
                onSegmentFilterChange={(value) => {
                  setSegmentFilter(value);
                  setHealthPage(1);
                }}
                searchQuery={searchQuery}
                onSearchChange={(value) => {
                  setSearchQuery(value);
                  setHealthPage(1);
                }}
                loginStatusFilter={loginStatusFilter}
                onLoginStatusChange={(value) => {
                  setLoginStatusFilter(value);
                  setHealthPage(1);
                }}
              />

              <HealthScoreTable
                healthScores={healthScores}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setHealthPage}
                loading={healthLoading}
              />
            </Card>
          </TabsContent>

          {/* AUTOMATION TAB */}
          <TabsContent value="automation" className="space-y-6">
            <AutomationRulesPanel />
          </TabsContent>

          {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex gap-2 mb-4">
                <Button onClick={() => setShowQuickModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer
                </Button>
                <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
                  📚 Templates
                </Button>
                <Button variant="outline" onClick={() => setShowSequences(!showSequences)}>
                  🔗 Séquences
                </Button>
                <Button variant="outline" onClick={() => setShowAISuggestions(!showAISuggestions)}>
                  ✨ IA Suggestions
                </Button>
              </div>

              {showTemplates && (
                <TemplateSelector
                  segments={segments}
                  onSelectTemplate={(template) => {
                    const segment = segments.find(s => s.segment_key === template.segment_key);
                    setNewCampaign({
                      ...newCampaign,
                      campaign_name: template.name,
                      subject: template.subject || '',
                      target_segment_id: segment?.id || '',
                      channels: ['email']
                    });
                    setEmailTemplate({ ...emailTemplate, html_content: template.html_content });
                    setShowTemplates(false);
                  }}
                />
              )}

              {showSequences && (
                <SequenceBuilder
                  campaigns={campaigns}
                  segments={segments}
                  onSave={createSequence}
                />
              )}

              {showAISuggestions && (
                <AISuggestionsPanel
                  segments={segments}
                  onUseSuggestion={(suggestion) => {
                    setNewCampaign({ ...newCampaign, ...suggestion });
                    setShowAISuggestions(false);
                  }}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Créer une Campagne</h3>
                <EmailTemplateEditor
                  template={emailTemplate}
                  onChange={setEmailTemplate}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>Nom de la campagne</Label>
                    <Input
                      value={newCampaign.campaign_name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, campaign_name: e.target.value })}
                      placeholder="Ex: Relance utilisateurs dormants"
                    />
                  </div>
                  <div>
                    <Label>Segment cible</Label>
                    <Select
                      value={newCampaign.target_segment_id}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, target_segment_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un segment" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map(segment => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.segment_name} ({segment.user_count} users)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="mb-2 block">Canaux d'envoi</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCampaign.channels.includes('email')}
                        onChange={(e) => {
                          const channels = e.target.checked 
                            ? [...newCampaign.channels, 'email']
                            : newCampaign.channels.filter(c => c !== 'email');
                          setNewCampaign({ ...newCampaign, channels });
                        }}
                        className="w-4 h-4"
                      />
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCampaign.channels.includes('in_app')}
                        onChange={(e) => {
                          const channels = e.target.checked 
                            ? [...newCampaign.channels, 'in_app']
                            : newCampaign.channels.filter(c => c !== 'in_app');
                          setNewCampaign({ ...newCampaign, channels });
                        }}
                        className="w-4 h-4"
                      />
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">In-App</span>
                    </label>
                  </div>
                  {newCampaign.channels.length === 0 && (
                    <p className="text-xs text-destructive mt-1">Au moins un canal doit être sélectionné</p>
                  )}
                </div>
                <Button 
                  onClick={handleCreateCampaign} 
                  className="mt-4 w-full"
                  disabled={!newCampaign.campaign_name || !newCampaign.target_segment_id || !emailTemplate.subject || !emailTemplate.html_content || newCampaign.channels.length === 0}
                >
                  Créer la Campagne
                </Button>
              </Card>

                <div className="space-y-4">
                  <CampaignCalendar 
                    campaigns={campaigns}
                    onDateClick={(date) => {
                      setQuickModalDate(date);
                      setShowQuickModal(true);
                    }}
                  />
                </div>
                
                <CampaignStatsWidget campaigns={campaigns} />
            </div>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Campagnes Créées</h3>
                <div className="flex gap-2">
                  <Label className="text-sm text-muted-foreground">Webhook Zapier (optionnel):</Label>
                  <Input
                    value={zapierWebhook}
                    onChange={(e) => setZapierWebhook(e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                    className="max-w-xs"
                  />
                </div>
              </div>
              {campaignsLoading ? (
                <Skeleton className="h-48" />
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune campagne créée</p>
                  <p className="text-sm">Créez votre première campagne ci-dessus</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{campaign.campaign_name}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {campaign.segment?.segment_name && `Segment: ${campaign.segment.segment_name}`}
                            {campaign.lifecycle_stage?.stage_name && `Lifecycle: ${campaign.lifecycle_stage.stage_name}`}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {campaign.channels?.map(channel => (
                              <Badge key={channel} variant="outline" className="text-xs">
                                {channel === 'email' && '📧'}
                                {channel === 'in_app' && '💬'}
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => sendCampaign(campaign.id, zapierWebhook)}
                            disabled={campaign.status !== 'draft'}
                          >
                            📧 Envoyer
                          </Button>
                        </div>
                      </div>
                      {campaign.stats && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Envoyés</p>
                            <p className="text-lg font-bold">{campaign.stats.total_sent}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ouvertures</p>
                            <p className="text-lg font-bold">
                              {campaign.stats.opened}
                              {campaign.stats.total_sent > 0 && (
                                <span className="text-xs ml-1 text-muted-foreground">
                                  ({Math.round((campaign.stats.opened / campaign.stats.total_sent) * 100)}%)
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Clics</p>
                            <p className="text-lg font-bold">
                              {campaign.stats.clicked}
                              {campaign.stats.total_sent > 0 && (
                                <span className="text-xs ml-1 text-muted-foreground">
                                  ({Math.round((campaign.stats.clicked / campaign.stats.total_sent) * 100)}%)
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Conversions</p>
                            <p className="text-lg font-bold">{campaign.stats.converted}</p>
                          </div>
                        </div>
                      )}
                      {campaign.status === 'draft' && (
                        <Button
                          onClick={() => sendCampaign(campaign.id, zapierWebhook)}
                          className="mt-4"
                          size="sm"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Envoyer Maintenant
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* FEEDBACK TAB */}
          <TabsContent value="feedback" className="space-y-6">
            <FeedbackPanel />
          </TabsContent>

          {/* COHORTS TAB */}
          <TabsContent value="cohorts" className="space-y-6">
            <CohortAnalysis />
          </TabsContent>

          {/* A/B TESTING TAB */}
          <TabsContent value="ab-testing" className="space-y-6">
            <ABTestingPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
