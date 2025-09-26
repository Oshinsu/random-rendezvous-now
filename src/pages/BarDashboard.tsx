import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBarOwner } from '@/hooks/useBarOwner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Users, Euro, TrendingUp, Clock, Calendar, Building } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarOwnerApplication } from '@/components/bar/BarOwnerApplication';
import { BarAnalyticsChart } from '@/components/bar/BarAnalyticsChart';

export default function BarDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    barOwner,
    subscription,
    analytics,
    isLoadingProfile,
    isLoadingSubscription,
    isLoadingAnalytics,
    isApproved,
    isTrialActive,
    isSubscriptionActive,
  } = useBarOwner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      approved: 'default',
      rejected: 'destructive',
      suspended: 'secondary',
    } as const;

    const labels = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      suspended: 'Suspendu',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getSubscriptionBadge = (status: string) => {
    const variants = {
      trial: 'secondary',
      active: 'default',
      past_due: 'destructive',
      canceled: 'outline',
      unpaid: 'destructive',
    } as const;

    const labels = {
      trial: 'Essai gratuit',
      active: 'Actif',
      past_due: 'Impayé',
      canceled: 'Annulé',
      unpaid: 'Impayé',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (authLoading || isLoadingProfile) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Show application form if not a bar owner yet
  if (!barOwner) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold">Espace Gérant de Bar</h1>
            <p className="text-muted-foreground mt-2">
              Rejoignez Random et découvrez combien de clients nous vous envoyons chaque mois
            </p>
          </div>
          <BarOwnerApplication />
        </div>
      </div>
    );
  }

  // Show pending status
  if (barOwner.status === 'pending') {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-3xl font-bold mb-4">Demande en cours de traitement</h1>
          <p className="text-muted-foreground mb-6">
            Votre demande pour <strong>{barOwner.bar_name}</strong> est en cours de vérification.
            Nous vous contacterons dans les 48h.
          </p>
          <Card>
            <CardHeader>
              <CardTitle>Informations soumises</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <strong>Établissement :</strong> {barOwner.bar_name}
              </div>
              <div>
                <strong>Adresse :</strong> {barOwner.bar_address}
              </div>
              <div>
                <strong>Contact :</strong> {barOwner.contact_email}
              </div>
              <div>
                <strong>Statut :</strong> {getStatusBadge(barOwner.status)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show rejected status
  if (barOwner.status === 'rejected') {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4 text-destructive">Demande rejetée</h1>
          <p className="text-muted-foreground mb-6">
            Votre demande pour {barOwner.bar_name} n'a pas pu être approuvée.
            Contactez-nous pour plus d'informations.
          </p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Main dashboard for approved bar owners
  const currentMonth = analytics?.[0];
  const previousMonth = analytics?.[1];

  const monthlyGrowth = currentMonth && previousMonth 
    ? ((currentMonth.total_customers - previousMonth.total_customers) / previousMonth.total_customers) * 100
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">{barOwner.bar_name}</p>
        </div>
        <div className="flex items-center gap-4">
          {subscription && getSubscriptionBadge(subscription.status)}
        </div>
      </div>

      <Separator />

      {/* Subscription Status */}
      {isTrialActive && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Essai gratuit actif
            </CardTitle>
            <CardDescription>
              Votre essai gratuit se termine le{' '}
              {subscription?.trial_end_date && 
                new Date(subscription.trial_end_date).toLocaleDateString('fr-FR')
              }. Profitez-en pour découvrir tous nos services !
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              Passer à l'abonnement Premium - 150€/mois
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoadingAnalytics ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    currentMonth?.total_customers || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Clients ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoadingAnalytics ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    currentMonth?.total_groups || 0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Groupes Random</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Euro className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoadingAnalytics ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    formatCurrency(currentMonth?.estimated_revenue_eur || 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">CA estimé</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {isLoadingAnalytics ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${monthlyGrowth > 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%`
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Croissance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart */}
      {analytics && analytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
            <CardDescription>
              Nombre de clients Random amenés dans votre établissement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarAnalyticsChart data={analytics} />
          </CardContent>
        </Card>
      )}

      {/* ROI Information */}
      <Card>
        <CardHeader>
          <CardTitle>Retour sur investissement</CardTitle>
          <CardDescription>
            Pourquoi Random vaut largement votre abonnement de 150€/mois
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Ce mois-ci avec Random :</h4>
              <ul className="space-y-1 text-sm">
                <li>• {currentMonth?.total_customers || 0} nouveaux clients</li>
                <li>• {formatCurrency(currentMonth?.estimated_revenue_eur || 0)} de CA généré</li>
                <li>• Moyenne de {currentMonth?.total_groups || 0} groupes par mois</li>
                <li>• 0€ de frais marketing ou acquisition</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Votre investissement :</h4>
              <ul className="space-y-1 text-sm">
                <li>• 150€/mois d'abonnement Random</li>
                <li>• Soit {((150 / (currentMonth?.total_customers || 1))).toFixed(2)}€ par client acquis</li>
                <li>• ROI : {(((currentMonth?.estimated_revenue_eur || 0) / 100 / 150)).toFixed(1)}x votre investissement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}