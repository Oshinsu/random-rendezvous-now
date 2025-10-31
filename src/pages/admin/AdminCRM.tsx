import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, BarChart3, MessageSquare, TestTube, Calendar, UserCheck, Activity, Download, Plus, Sparkles, InfoIcon } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { CRMFilters } from '@/components/crm/CRMFilters';
import { CohortAnalysis } from '@/components/crm/CohortAnalysis';
import { CampaignCalendar } from '@/components/crm/CampaignCalendar';
import { EmailTemplateEditor } from '@/components/crm/EmailTemplateEditor';
import { TemplateSelector } from '@/components/crm/TemplateSelector';
import { QuickCampaignModal } from '@/components/crm/QuickCampaignModal';
import { SequenceBuilder } from '@/components/crm/SequenceBuilder';
import { AISuggestionsPanel } from '@/components/crm/AISuggestionsPanel';
import { CampaignStatsWidget } from '@/components/crm/CampaignStatsWidget';
import { useCRMSequences } from '@/hooks/useCRMSequences';
import { useSendTimeOptimization } from '@/hooks/useSendTimeOptimization';
import { getTemplateById } from '@/data/campaignTemplateLibrary';
import { CRMOverview } from '@/components/crm/CRMOverview';
import { CRMSegmentsTab } from '@/components/crm/CRMSegmentsTab';
import { AutomationRulesPanel } from '@/components/crm/AutomationRulesPanel';
import { CRMMonitoringDashboard } from '@/components/crm/CRMMonitoringDashboard';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { HealthScoreOverview } from '@/components/crm/HealthScoreOverview';

// CRM Dashboard - Admin interface for managing campaigns, segments, and user health
export default function AdminCRM() {
  // ✅ PHASE 2: Auth guard
  const { isAdmin, loading: authLoading } = useAdminAuth();
  
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
  const { campaigns, loading: campaignsLoading, createCampaign, sendCampaign, rescheduleCampaign } = useCRMCampaigns();

  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_type: 'email' as const,
    trigger_type: 'manual' as const,
    subject: '',
    content: '',
    target_segment_id: '',
    channels: ['email'] as string[],
    send_at: null as string | null  // ✅ PHASE 2: null au lieu de ''
  });
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickModalDate, setQuickModalDate] = useState<Date>();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSequences, setShowSequences] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const { sequences, createSequence } = useCRMSequences();
  const { data: optimization, isLoading: optimizationLoading } = useSendTimeOptimization(newCampaign.target_segment_id);
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
        channels: ['email'],
        send_at: null  // ✅ PHASE 2: null au lieu de ''
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

  // ✅ PHASE 2: Guard #1 - Wait for auth initialization
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
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }
  
  // ✅ PHASE 2: Guard #2 - Redirect if not admin
  if (!isAdmin) {
    console.log('🔒 Not admin, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

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

        {/* Monitoring Dashboard (SOTA Oct 2025) */}
        <CRMMonitoringDashboard />

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-6 gap-1">
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="segments">👥 Segments</TabsTrigger>
            <TabsTrigger value="health">💚 Health</TabsTrigger>
            <TabsTrigger value="campaigns">📧 Campagnes</TabsTrigger>
            <TabsTrigger value="automation">⚡ Automation</TabsTrigger>
            <TabsTrigger value="cohorts">📈 Cohortes</TabsTrigger>
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
                    Vue globale de l'engagement et de la santé des utilisateurs
                  </p>
                </div>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
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

              <HealthScoreOverview
                stats={healthStats}
                healthScores={healthScores}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setHealthPage}
                loading={healthLoading}
                onCalculateHealth={handleCalculateHealth}
                calculating={calculatingHealth}
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
                    setEmailTemplate({ 
                      subject: template.subject || '',
                      html_content: template.html_content,
                      variables: []
                    });
                    setShowTemplates(false);
                    toast({
                      title: 'Template appliqué',
                      description: 'Vous pouvez maintenant personnaliser le contenu'
                    });
                  }}
                />
              )}

              {showSequences && (
                <SequenceBuilder
                  campaigns={campaigns}
                  segments={segments}
                  onSave={async (sequenceData) => {
                    await createSequence(sequenceData);
                    setShowSequences(false);
                  }}
                />
              )}

              {showAISuggestions && (
                <AISuggestionsPanel
                  segments={segments}
                  onUseSuggestion={(suggestion) => {
                    setNewCampaign({ 
                      ...newCampaign, 
                      campaign_name: suggestion.campaign_name,
                      subject: suggestion.subject || '',
                      target_segment_id: suggestion.target_segment_id || ''
                    });
                    setEmailTemplate({
                      subject: suggestion.subject || '',
                      html_content: suggestion.content || '',
                      variables: []
                    });
                    setShowAISuggestions(false);
                    toast({
                      title: 'Suggestion appliquée',
                      description: 'Vous pouvez maintenant personnaliser le contenu'
                    });
                  }}
                />
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
                <div className="space-y-6">
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

                {/* AI Send Time Optimization */}
                {optimization && newCampaign.target_segment_id && !optimizationLoading && (
                  <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">🤖 IA Recommande</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {optimization.recommended_day === 4 ? 'Jeudi' : 
                           optimization.recommended_day === 5 ? 'Vendredi' : 
                           'Jour ' + optimization.recommended_day} à {optimization.recommended_hour}h 
                          <span className="ml-1">
                            (Taux d'ouverture estimé : {optimization.estimated_open_rate ? Math.round(optimization.estimated_open_rate) : 0}%)
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Confiance : {
                            optimization.confidence === 'high' ? 'Élevée' :
                            optimization.confidence === 'medium' ? 'Moyenne' :
                            optimization.confidence === 'low' ? 'Faible' :
                            'Non disponible'
                          } ({optimization.data_points || 0} points de données)
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const recommendedDate = new Date();
                          recommendedDate.setHours(optimization.recommended_hour, 0, 0, 0);
                          setNewCampaign({ ...newCampaign, send_at: recommendedDate.toISOString() });
                        }}
                      >
                        Appliquer
                      </Button>
                    </div>
                  </div>
                )}

                {optimizationLoading && newCampaign.target_segment_id && (
                  <div className="mt-4 p-3 bg-muted/50 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      Analyse du meilleur moment d'envoi...
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleCreateCampaign} 
                  className="mt-4 w-full"
                  disabled={!newCampaign.campaign_name || !newCampaign.target_segment_id || !emailTemplate.subject || !emailTemplate.html_content || newCampaign.channels.length === 0}
                >
                  Créer la Campagne
                </Button>
              </Card>

                  <CampaignCalendar 
                    campaigns={campaigns}
                    onDateClick={(date) => {
                      setQuickModalDate(date);
                      setShowQuickModal(true);
                    }}
                    onEventClick={(campaignId) => {
                      const campaign = campaigns.find(c => c.id === campaignId);
                      if (campaign) {
                        setSelectedCampaign(campaign);
                      }
                    }}
                    onEventDrop={async (campaignId, newDate) => {
                      await rescheduleCampaign(campaignId, newDate);
                      toast({
                        title: 'Campagne déplacée',
                        description: 'La date d\'envoi a été mise à jour'
                      });
                    }}
                  />

                  {/* Campaign Details Inline Display */}
                  {selectedCampaign && (
                    <Card className="p-6 mt-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">{selectedCampaign.campaign_name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedCampaign.subject}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            selectedCampaign.status === 'active' ? 'default' : 
                            selectedCampaign.status === 'completed' ? 'secondary' : 
                            'outline'
                          }>
                            {selectedCampaign.status}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedCampaign(null)}>✕</Button>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 border rounded-lg">
                          <p className="text-xs text-muted-foreground">Taux d'ouverture</p>
                          <p className="text-2xl font-bold">
                            {selectedCampaign.total_sends && selectedCampaign.total_opens 
                              ? ((selectedCampaign.total_opens / selectedCampaign.total_sends) * 100).toFixed(1)
                              : '0'}%
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-xs text-muted-foreground">Taux de clic</p>
                          <p className="text-2xl font-bold">
                            {selectedCampaign.total_sends && selectedCampaign.total_clicks
                              ? ((selectedCampaign.total_clicks / selectedCampaign.total_sends) * 100).toFixed(1)
                              : '0'}%
                          </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <p className="text-xs text-muted-foreground">Conversions</p>
                          <p className="text-2xl font-bold">
                            {selectedCampaign.total_sends && selectedCampaign.total_conversions
                              ? ((selectedCampaign.total_conversions / selectedCampaign.total_sends) * 100).toFixed(1)
                              : '0'}%
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {selectedCampaign.status === 'draft' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => sendCampaign(selectedCampaign.id, zapierWebhook)}
                                    disabled={(() => {
                                      const segment = segments.find(s => s.id === selectedCampaign.target_segment_id);
                                      return !segment || (segment.user_count ?? 0) === 0;
                                    })()}
                                  >
                                    {(() => {
                                      const segment = segments.find(s => s.id === selectedCampaign.target_segment_id);
                                      return segment && segment.user_count === 0 && <InfoIcon className="h-4 w-4 mr-2" />;
                                    })()}
                                    Envoyer maintenant
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {(() => {
                                const segment = segments.find(s => s.id === selectedCampaign.target_segment_id);
                                if (segment && segment.user_count === 0) {
                                  return (
                                    <TooltipContent>
                                      Ce segment est vide ({segment.user_count || 0} utilisateurs). Recalculez les segments ou vérifiez les critères.
                                    </TooltipContent>
                                  );
                                }
                                return null;
                              })()}
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {selectedCampaign.status === 'scheduled' && (
                          <Button size="sm" variant="outline" onClick={async () => {
                            const newDate = new Date(selectedCampaign.send_at);
                            newDate.setDate(newDate.getDate() + 1);
                            await rescheduleCampaign(selectedCampaign.id, newDate.toISOString());
                            toast({
                              title: 'Campagne reprogrammée',
                              description: 'La date d\'envoi a été mise à jour'
                            });
                          }}>
                            Reprogrammer
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => {
                          setNewCampaign({
                            campaign_name: `${selectedCampaign.campaign_name} (copie)`,
                            campaign_type: 'email',
                            trigger_type: 'manual',
                            subject: selectedCampaign.subject || selectedCampaign.campaign_name,
                            content: '',
                            target_segment_id: '',
                            channels: ['email'],
                            send_at: ''
                          });
                          setEmailTemplate({
                            subject: selectedCampaign.subject || selectedCampaign.campaign_name,
                            html_content: '',
                            variables: []
                          });
                          setSelectedCampaign(null);
                          toast({
                            title: 'Campagne dupliquée',
                            description: 'Modifiez les paramètres et créez la campagne'
                          });
                        }}>
                          Dupliquer
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  <CampaignStatsWidget campaigns={campaigns} />
                </div>
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
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button
                                    size="sm"
                                    onClick={() => sendCampaign(campaign.id, zapierWebhook)}
                                    disabled={campaign.status !== 'draft' || (() => {
                                      const segment = segments.find(s => s.id === campaign.target_segment_id);
                                      return !segment || (segment.user_count ?? 0) === 0;
                                    })()}
                                  >
                                    {(() => {
                                      const segment = segments.find(s => s.id === campaign.target_segment_id);
                                      return segment && segment.user_count === 0 && <InfoIcon className="h-4 w-4 mr-2" />;
                                    })()}
                                    📧 Envoyer
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {(() => {
                                const segment = segments.find(s => s.id === campaign.target_segment_id);
                                if (segment && segment.user_count === 0) {
                                  return (
                                    <TooltipContent>
                                      Ce segment est vide ({segment.user_count || 0} utilisateurs). Recalculez les segments ou vérifiez les critères.
                                    </TooltipContent>
                                  );
                                }
                                return null;
                              })()}
                            </Tooltip>
                          </TooltipProvider>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  onClick={() => sendCampaign(campaign.id, zapierWebhook)}
                                  className="mt-4"
                                  size="sm"
                                  disabled={(() => {
                                    const segment = segments.find(s => s.id === campaign.target_segment_id);
                                    return !segment || (segment.user_count ?? 0) === 0;
                                  })()}
                                >
                                  {(() => {
                                    const segment = segments.find(s => s.id === campaign.target_segment_id);
                                    return segment && segment.user_count === 0 && <InfoIcon className="h-4 w-4 mr-2" />;
                                  })()}
                                  <Mail className="mr-2 h-4 w-4" />
                                  Envoyer Maintenant
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {(() => {
                              const segment = segments.find(s => s.id === campaign.target_segment_id);
                              if (segment && segment.user_count === 0) {
                                return (
                                  <TooltipContent>
                                    Ce segment est vide ({segment.user_count || 0} utilisateurs). Recalculez les segments ou vérifiez les critères.
                                  </TooltipContent>
                                );
                              }
                              return null;
                            })()}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* COHORTS TAB */}
          <TabsContent value="cohorts" className="space-y-6">
            <CohortAnalysis />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <QuickCampaignModal
          open={showQuickModal}
          onOpenChange={setShowQuickModal}
          initialDate={quickModalDate}
          segments={segments}
          campaigns={campaigns}
          onCreateCampaign={handleCreateCampaign}
        />
      </div>
    </AdminLayout>
  );
}
