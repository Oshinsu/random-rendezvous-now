import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBarOwner } from '@/hooks/useBarOwner';
import { useBarSubscription } from '@/hooks/useBarSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/ui/stats-card';
import { BarAnalyticsChart } from '@/components/bar/BarAnalyticsChart';
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
  TrendingDown
} from 'lucide-react';

export default function BarDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect non-bar owners to application page (except admins)
  useEffect(() => {
    if (!isLoadingProfile && !adminLoading && !barOwner && !isAdmin) {
      navigate('/bar-application');
    }
  }, [barOwner, isLoadingProfile, adminLoading, isAdmin, navigate]);

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

  if (authLoading || isLoadingProfile || adminLoading) {
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

  // Allow access for approved bar owners OR admins
  if (!barOwner && !isAdmin) {
    return null; // Will redirect to application page
  }

  // For admins without bar owner profile, show admin dashboard view
  if (isAdmin && !barOwner) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Dashboard Admin</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant="secondary">Accès Administrateur</Badge>
              </div>
            </div>
          </div>
          <Separator />
          
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">Dashboard Administrateur</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                En tant qu'administrateur, vous avez accès à tous les dashboards. 
                Les analytics spécifiques nécessitent un profil bar validé.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/bar-application')} variant="outline">
                  Créer un profil bar
                </Button>
                <Button onClick={() => navigate('/admin/dashboard')}>
                  Dashboard Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <StatsCard
            title="Groupes reçus"
            value={isLoadingAnalytics ? "..." : (currentMonth?.total_groups || 0)}
            icon={<BarChart3 className="h-6 w-6" />}
            description="Ce mois-ci"
          />

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

          <StatsCard
            title="ROI mensuel"
            value={isLoadingAnalytics ? "..." : `${roi.toFixed(1)}x`}
            icon={<TrendingUp className="h-6 w-6" />}
            description="Retour sur investissement"
          />

          <StatsCard
            title="Coût par client"
            value={isLoadingAnalytics ? "..." : `${costPerCustomer.toFixed(2)}€`}
            icon={<Target className="h-6 w-6" />}
            description="Coût d'acquisition"
          />

          <StatsCard
            title="Taille moyenne"
            value={isLoadingAnalytics ? "..." : `${avgGroupSize} pers.`}
            icon={<Activity className="h-6 w-6" />}
            description="Par groupe"
          />

          <StatsCard
            title="Total 6 mois"
            value={isLoadingAnalytics ? "..." : totalCustomers}
            icon={<Award className="h-6 w-6" />}
            description="Clients amenés"
          />

          <StatsCard
            title="Moyenne mensuelle"
            value={isLoadingAnalytics ? "..." : Math.round(avgCustomersPerMonth)}
            icon={<Calendar className="h-6 w-6" />}
            description="Clients par mois"
          />
        </div>

        {/* Analytics Chart */}
        {analytics && analytics.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Évolution mensuelle
                  </CardTitle>
                  <CardDescription>
                    Clients Random amenés dans votre établissement
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BarAnalyticsChart data={analytics} />
            </CardContent>
          </Card>
        )}

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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Recommandations
              </CardTitle>
              <CardDescription>
                Maximisez vos revenus Random
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  <div className="text-sm">
                    <p className="font-medium">Optimisez vos horaires</p>
                    <p className="text-muted-foreground">Les groupes arrivent surtout entre 19h-21h</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  <div className="text-sm">
                    <p className="font-medium">Préparez l'accueil</p>
                    <p className="text-muted-foreground">Groupes de {avgGroupSize} personnes en moyenne</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  <div className="text-sm">
                    <p className="font-medium">Fidélisez vos clients</p>
                    <p className="text-muted-foreground">Offrez une expérience mémorable</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}