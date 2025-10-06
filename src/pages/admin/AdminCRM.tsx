import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Mail, BarChart3, AlertTriangle, Target } from 'lucide-react';
import { useCRMAnalytics } from '@/hooks/useCRMAnalytics';
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

export default function AdminCRM() {
  const { analytics, loading: analyticsLoading } = useCRMAnalytics();
  const { segments, loading: segmentsLoading } = useCRMSegments();
  const { healthScores, stats: healthStats, loading: healthLoading, calculateAllScores } = useCRMHealth();
  const { campaigns, loading: campaignsLoading, createCampaign, sendCampaign } = useCRMCampaigns();

  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    campaign_type: 'email' as const,
    trigger_type: 'manual' as const,
    subject: '',
    content: '',
    target_segment_id: ''
  });
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [calculatingHealth, setCalculatingHealth] = useState(false);

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
      await createCampaign(newCampaign);
      setNewCampaign({
        campaign_name: '',
        campaign_type: 'email',
        trigger_type: 'manual',
        subject: '',
        content: '',
        target_segment_id: ''
      });
    } catch (error) {
      // Error handled in hook
    }
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
        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-500" />
                <Badge variant="secondary">{analytics.activeUsers} actifs</Badge>
              </div>
              <h3 className="text-2xl font-bold">{analytics.totalUsers}</h3>
              <p className="text-sm text-muted-foreground">Utilisateurs Total</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <Badge variant={analytics.avgHealthScore >= 70 ? 'default' : 'destructive'}>
                  {analytics.avgHealthScore}/100
                </Badge>
              </div>
              <h3 className="text-2xl font-bold">Health Score Moyen</h3>
              <Progress value={analytics.avgHealthScore} className="mt-2" />
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <Badge variant="destructive">{analytics.churnRisk.critical + analytics.churnRisk.high}</Badge>
              </div>
              <h3 className="text-2xl font-bold">Risque de Churn</h3>
              <p className="text-sm text-muted-foreground">
                {analytics.churnRisk.critical} critiques, {analytics.churnRisk.high} élevés
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-purple-500" />
                <Badge variant="secondary">{analytics.funnelStats.conversionRate}%</Badge>
              </div>
              <h3 className="text-2xl font-bold">Taux de Conversion</h3>
              <p className="text-sm text-muted-foreground">
                Signup → Première sortie
              </p>
            </Card>
          </div>
        ) : null}

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="segments">👥 Segments</TabsTrigger>
            <TabsTrigger value="health">💚 Health Scores</TabsTrigger>
            <TabsTrigger value="campaigns">📧 Campagnes</TabsTrigger>
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
            {segmentsLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {segments.map(segment => (
                  <Card key={segment.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                      <Badge variant="secondary">{segment.user_count} users</Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{segment.segment_name}</h3>
                    <p className="text-sm text-muted-foreground">{segment.description}</p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* HEALTH SCORES TAB */}
          <TabsContent value="health" className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">Health Scores Utilisateurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Score moyen: {healthStats.avgHealthScore}/100
                  </p>
                </div>
                <Button onClick={handleCalculateHealth} disabled={calculatingHealth}>
                  {calculatingHealth ? 'Calcul...' : 'Recalculer Tous'}
                </Button>
              </div>

              {healthLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <div className="space-y-3">
                  {healthScores.slice(0, 10).map(health => (
                    <div key={health.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {health.profile?.first_name} {health.profile?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{health.profile?.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {health.total_outings} sorties • Inactif depuis {health.days_since_last_activity || 0} jours
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{health.health_score}</p>
                          <Badge variant={
                            health.churn_risk === 'critical' ? 'destructive' :
                            health.churn_risk === 'high' ? 'destructive' :
                            health.churn_risk === 'medium' ? 'secondary' : 'default'
                          }>
                            {health.churn_risk}
                          </Badge>
                        </div>
                        <Progress value={health.health_score} className="w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Créer une Campagne</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <div>
                  <Label>Sujet (Email)</Label>
                  <Input
                    value={newCampaign.subject}
                    onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                    placeholder="Sujet de l'email"
                  />
                </div>
                <div>
                  <Label>Webhook Zapier (optionnel)</Label>
                  <Input
                    value={zapierWebhook}
                    onChange={(e) => setZapierWebhook(e.target.value)}
                    placeholder="https://hooks.zapier.com/..."
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label>Contenu du message</Label>
                <Textarea
                  value={newCampaign.content}
                  onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                  placeholder="Contenu de la campagne..."
                  rows={5}
                />
              </div>
              <Button onClick={handleCreateCampaign}>
                Créer la Campagne
              </Button>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Campagnes Actives</h3>
              {campaignsLoading ? (
                <Skeleton className="h-48" />
              ) : (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div key={campaign.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{campaign.campaign_name}</h4>
                          <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      {campaign.stats && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Envoyés</p>
                            <p className="text-lg font-bold">{campaign.stats.total_sent}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ouvertures</p>
                            <p className="text-lg font-bold">{campaign.stats.opened}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Clics</p>
                            <p className="text-lg font-bold">{campaign.stats.clicked}</p>
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
                          Envoyer Maintenant
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
