import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBarOwner } from '@/hooks/useBarOwner';
import { useBarSubscription } from '@/hooks/useBarSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/ui/stats-card';
import { BarAnalyticsChart } from '@/components/bar/BarAnalyticsChart';
import { KPIDetailModal } from '@/components/bar/KPIDetailModal';
import { DynamicRecommendations } from '@/components/bar/DynamicRecommendations';
import { 
  Users, 
  TrendingUp, 
  Euro, 
  Calendar,
  Star,
  MapPin,
  Clock,
  BarChart3,
  Settings,
  CreditCard,
  Award,
  Target,
  Activity,
  DollarSign,
  Sparkles,
  ChevronRight,
  Building,
  ArrowUpRight,
  TrendingDown,
  LayoutDashboard,
  LineChart,
  Cog
} from 'lucide-react';

export default function BarDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    barOwner,
    analytics,
    isLoadingProfile,
    isLoadingAnalytics,
    isApproved,
  } = useBarOwner();

  const { 
    subscriptionStatus, 
    isLoadingSubscription, 
    createCheckout, 
    manageSubscription 
  } = useBarSubscription();

  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState<{
    title: string;
    icon: React.ReactNode;
    value: number | string;
    type: 'customers' | 'groups' | 'revenue' | 'roi' | 'costPerCustomer' | 'groupSize' | 'totalCustomers' | 'avgCustomers';
  } | null>(null);

  const openKPIModal = (
    title: string, 
    icon: React.ReactNode, 
    value: number | string, 
    type: 'customers' | 'groups' | 'revenue' | 'roi' | 'costPerCustomer' | 'groupSize' | 'totalCustomers' | 'avgCustomers'
  ) => {
    setSelectedKPI({ title, icon, value, type });
    setKpiModalOpen(true);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect non-bar owners to application page
  useEffect(() => {
    if (!isLoadingProfile && !barOwner) {
      navigate('/bar-application');
    }
  }, [barOwner, isLoadingProfile, navigate]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const getSubscriptionStatusBadge = () => {
    if (isLoadingSubscription) return <Badge variant="outline">Chargement...</Badge>;
    if (!subscriptionStatus?.subscribed) return <Badge variant="destructive">Non actif</Badge>;
    return <Badge variant="default">Actif</Badge>;
  };

  const handleSubscriptionAction = () => {
    if (subscriptionStatus?.subscribed) {
      manageSubscription.mutate();
    } else {
      createCheckout.mutate();
    }
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Show pending/rejected states
  if (barOwner && barOwner.status !== 'approved') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {barOwner.status === 'pending' && (
              <>
                <Clock className="h-16 w-16 mx-auto text-warning" />
                <h1 className="text-3xl font-bold">Demande en cours</h1>
                <p className="text-muted-foreground">
                  Votre demande pour <strong>{barOwner.bar_name}</strong> est en cours de vérification.
                  Nous vous contacterons dans les 48h.
                </p>
              </>
            )}
            {barOwner.status === 'rejected' && (
              <>
                <h1 className="text-3xl font-bold text-destructive">Demande rejetée</h1>
                <p className="text-muted-foreground">
                  Votre demande n'a pas pu être approuvée. Contactez-nous pour plus d'informations.
                </p>
                <Button onClick={() => navigate('/')}>
                  Retour à l'accueil
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!barOwner || !isApproved) {
    return null; // Will redirect to application page
  }

  // Calculate metrics
  const currentMonth = analytics?.[0];
  const previousMonth = analytics?.[1];
  const lastSixMonths = analytics?.slice(0, 6) || [];
  
  const totalCustomers = lastSixMonths.reduce((sum, month) => sum + month.total_customers, 0);
  const totalRevenue = lastSixMonths.reduce((sum, month) => sum + month.estimated_revenue_eur, 0);
  const avgCustomersPerMonth = totalCustomers / Math.max(lastSixMonths.length, 1);
  const avgGroupSize = currentMonth?.total_customers && currentMonth?.total_groups 
    ? Math.round(currentMonth.total_customers / currentMonth.total_groups) 
    : 5;

  const customerGrowth = currentMonth && previousMonth 
    ? ((currentMonth.total_customers - previousMonth.total_customers) / Math.max(previousMonth.total_customers, 1)) * 100
    : 0;

  const revenueGrowth = currentMonth && previousMonth 
    ? ((currentMonth.estimated_revenue_eur - previousMonth.estimated_revenue_eur) / Math.max(previousMonth.estimated_revenue_eur, 1)) * 100
    : 0;

  const roi = currentMonth ? (currentMonth.estimated_revenue_eur / 100) / 150 : 0;
  const costPerCustomer = currentMonth?.total_customers ? (150 / currentMonth.total_customers) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>{barOwner.bar_name}</span>
              <Separator orientation="vertical" className="h-4" />
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{barOwner.bar_address}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getSubscriptionStatusBadge()}
            <Button 
              variant={subscriptionStatus?.subscribed ? "outline" : "default"}
              onClick={handleSubscriptionAction}
              disabled={createCheckout.isPending || manageSubscription.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {subscriptionStatus?.subscribed ? "Gérer l'abonnement" : "S'abonner"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Subscription Alert */}
        {!subscriptionStatus?.subscribed && (
          <Card className="border-warning bg-warning/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="font-semibold">Activez votre abonnement pour débloquer toutes les fonctionnalités</h3>
                  <p className="text-sm text-muted-foreground">
                    Accédez aux analytics avancés, aux rapports détaillés et maximisez vos revenus avec Random.
                  </p>
                  <Button size="sm" onClick={handleSubscriptionAction}>
                    Commencer maintenant - 150€/mois
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <LineChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Cog className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'Clients ce mois', 
                  <Users className="h-6 w-6" />, 
                  currentMonth?.total_customers || 0, 
                  'customers'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="Clients ce mois"
                  value={isLoadingAnalytics ? "..." : (currentMonth?.total_customers || 0)}
                  icon={<Users className="h-6 w-6" />}
                  description="Nouveaux clients Random"
                  trend={previousMonth && currentMonth ? {
                    value: Math.abs(customerGrowth),
                    isPositive: customerGrowth > 0
                  } : undefined}
                />
              </div>

              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'Groupes reçus', 
                  <BarChart3 className="h-6 w-6" />, 
                  currentMonth?.total_groups || 0, 
                  'groups'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="Groupes reçus"
                  value={isLoadingAnalytics ? "..." : (currentMonth?.total_groups || 0)}
                  icon={<BarChart3 className="h-6 w-6" />}
                  description="Ce mois-ci"
                />
              </div>

              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'CA généré', 
                  <Euro className="h-6 w-6" />, 
                  formatCurrency(currentMonth?.estimated_revenue_eur || 0), 
                  'revenue'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="CA généré"
                  value={isLoadingAnalytics ? "..." : formatCurrency(currentMonth?.estimated_revenue_eur || 0)}
                  icon={<Euro className="h-6 w-6" />}
                  description="Chiffre d'affaires estimé"
                  trend={previousMonth && currentMonth ? {
                    value: Math.abs(revenueGrowth),
                    isPositive: revenueGrowth > 0
                  } : undefined}
                />
              </div>

              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'ROI mensuel', 
                  <TrendingUp className="h-6 w-6" />, 
                  `${roi.toFixed(1)}x`, 
                  'roi'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="ROI mensuel"
                  value={isLoadingAnalytics ? "..." : `${roi.toFixed(1)}x`}
                  icon={<TrendingUp className="h-6 w-6" />}
                  description="Retour sur investissement"
                />
              </div>

              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'Coût par client', 
                  <Target className="h-6 w-6" />, 
                  `${costPerCustomer.toFixed(2)}€`, 
                  'costPerCustomer'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="Coût par client"
                  value={isLoadingAnalytics ? "..." : `${costPerCustomer.toFixed(2)}€`}
                  icon={<Target className="h-6 w-6" />}
                  description="Coût d'acquisition"
                />
              </div>

              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'Taille moyenne', 
                  <Activity className="h-6 w-6" />, 
                  `${avgGroupSize} pers.`, 
                  'groupSize'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="Taille moyenne"
                  value={isLoadingAnalytics ? "..." : `${avgGroupSize} pers.`}
                  icon={<Activity className="h-6 w-6" />}
                  description="Par groupe"
                />
              </div>

              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'Total 6 mois', 
                  <Award className="h-6 w-6" />, 
                  totalCustomers, 
                  'totalCustomers'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="Total 6 mois"
                  value={isLoadingAnalytics ? "..." : totalCustomers}
                  icon={<Award className="h-6 w-6" />}
                  description="Clients amenés"
                />
              </div>

              <div 
                onClick={() => !isLoadingAnalytics && openKPIModal(
                  'Moyenne mensuelle', 
                  <Calendar className="h-6 w-6" />, 
                  Math.round(avgCustomersPerMonth), 
                  'avgCustomers'
                )}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <StatsCard
                  title="Moyenne mensuelle"
                  value={isLoadingAnalytics ? "..." : Math.round(avgCustomersPerMonth)}
                  icon={<Calendar className="h-6 w-6" />}
                  description="Clients par mois"
                />
              </div>
            </div>

            {/* ROI & Business Impact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Impact business
                  </CardTitle>
                  <CardDescription>
                    L'effet Random sur votre établissement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Nouveaux clients ce mois</span>
                      <span className="font-semibold">{currentMonth?.total_customers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Revenus générés</span>
                      <span className="font-semibold">{formatCurrency(currentMonth?.estimated_revenue_eur || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Coût d'acquisition moyen</span>
                      <span className="font-semibold">{costPerCustomer.toFixed(2)}€</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-primary">
                      <span className="font-medium">ROI mensuel</span>
                      <span className="font-bold text-lg">{roi.toFixed(1)}x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analytics && analytics.length > 0 && (
                <DynamicRecommendations
                  analytics={analytics}
                  avgGroupSize={avgGroupSize}
                  roi={roi}
                  customerGrowth={customerGrowth}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">

            {/* Analytics Chart */}
            {analytics && analytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Évolution mensuelle
                  </CardTitle>
                  <CardDescription>
                    Analyse complète de vos métriques
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BarAnalyticsChart data={analytics} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du bar</CardTitle>
                <CardDescription>
                  Configuration de votre établissement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Paramètres à venir...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* KPI Detail Modal */}
        {selectedKPI && analytics && (
          <KPIDetailModal
            open={kpiModalOpen}
            onOpenChange={setKpiModalOpen}
            title={selectedKPI.title}
            icon={selectedKPI.icon}
            currentValue={selectedKPI.value}
            analytics={analytics}
            metricType={selectedKPI.type}
          />
        )}
      </div>
    </div>
  );
}