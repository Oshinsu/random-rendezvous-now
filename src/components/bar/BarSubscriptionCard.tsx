import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import type { BarSubscription } from '@/hooks/useBarOwner';

interface BarSubscriptionCardProps {
  subscription: BarSubscription | null;
  onUpgrade?: () => void;
}

export function BarSubscriptionCard({ subscription, onUpgrade }: BarSubscriptionCardProps) {
  if (!subscription) {
    return (
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Aucun abonnement
          </CardTitle>
          <CardDescription>
            Vous devez avoir un abonnement actif pour accéder aux analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onUpgrade}>
            Démarrer l'essai gratuit
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'trial':
        return 'Essai gratuit';
      case 'active':
        return 'Actif';
      case 'past_due':
        return 'Paiement en retard';
      case 'canceled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const isTrialActive = subscription.status === 'trial' && 
    subscription.trial_end_date && 
    new Date() < new Date(subscription.trial_end_date);

  const daysLeft = subscription.trial_end_date 
    ? Math.ceil((new Date(subscription.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card className={`${subscription.status === 'trial' ? 'border-blue-200 bg-blue-50/50' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Abonnement
          </span>
          <Badge className={getStatusColor(subscription.status)}>
            {getStatusLabel(subscription.status)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Plan {subscription.plan_type} - {subscription.monthly_price_eur / 100}€/mois
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTrialActive && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span>
              <strong>{daysLeft} jours</strong> restants dans votre essai gratuit
            </span>
          </div>
        )}

        {subscription.current_period_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Renouvellement le{' '}
              {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}

        {subscription.status === 'trial' && (
          <Button onClick={onUpgrade} className="w-full">
            Passer au plan Premium
          </Button>
        )}

        {subscription.status === 'past_due' && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              Paiement en retard
            </p>
            <p className="text-sm text-red-600 mt-1">
              Votre accès sera suspendu si le paiement n'est pas effectué.
            </p>
            <Button variant="destructive" className="mt-2 w-full">
              Mettre à jour le paiement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}