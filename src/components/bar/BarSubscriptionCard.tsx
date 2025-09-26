import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, AlertTriangle, Clock } from 'lucide-react';
import { useBarSubscription } from '@/hooks/useBarSubscription';

interface BarSubscriptionCardProps {
  subscription?: any | null; // Legacy prop for compatibility
  onUpgrade?: () => void;
}

export function BarSubscriptionCard({ subscription: legacySubscription, onUpgrade }: BarSubscriptionCardProps) {
  const { subscriptionStatus, isLoadingSubscription, createCheckout, manageSubscription, isSubscribed } = useBarSubscription();
  
  // Loading state
  if (isLoadingSubscription) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no subscription, show upgrade prompt
  if (!isSubscribed) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Aucun abonnement actif</CardTitle>
          </div>
          <CardDescription>
            Démarrez votre essai gratuit pour accéder aux analytics détaillées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => createCheckout.mutate()} 
            className="w-full"
            variant="default"
            disabled={createCheckout.isPending}
          >
            {createCheckout.isPending ? 'Chargement...' : 'Commencer l\'essai gratuit (30 jours)'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Puis 150€/mois - Aucun engagement
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate trial or subscription end date
  const endDate = subscriptionStatus?.subscription_end ? new Date(subscriptionStatus.subscription_end) : null;
  const daysRemaining = endDate 
    ? Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Abonnement Random</CardTitle>
          </div>
          <Badge variant="default">
            Actif
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Plan</p>
            <p className="font-medium">Premium - 150€/mois</p>
          </div>
          <div>
            <p className="text-muted-foreground">Renouvellement</p>
            <p className="font-medium">
              {endDate ? endDate.toLocaleDateString('fr-FR') : 'Non défini'}
            </p>
          </div>
        </div>
        
        {daysRemaining > 0 && daysRemaining <= 7 && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-100 p-3 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>
              <strong>{daysRemaining} jours restants</strong> avant renouvellement
            </span>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => manageSubscription.mutate()}
            disabled={manageSubscription.isPending}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {manageSubscription.isPending ? 'Chargement...' : 'Gérer l\'abonnement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}