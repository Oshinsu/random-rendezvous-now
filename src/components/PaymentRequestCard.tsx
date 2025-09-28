import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Clock, Users, Euro, CheckCircle, AlertCircle } from 'lucide-react';
import { usePpuPayments } from '@/hooks/usePpuPayments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PaymentRequestCardProps {
  groupId: string;
}

export const PaymentRequestCard: React.FC<PaymentRequestCardProps> = ({ groupId }) => {
  const { 
    getGroupPayment, 
    getMemberPayments, 
    getUserPaymentStatus, 
    createPayment, 
    verifyPayments,
    ppuPrice 
  } = usePpuPayments();

  const { data: groupPayment, isLoading: loadingGroupPayment } = getGroupPayment(groupId);
  const { data: memberPayments, isLoading: loadingMemberPayments } = getMemberPayments(groupId);
  const { data: userPayment, isLoading: loadingUserPayment } = getUserPaymentStatus(groupId);

  if (loadingGroupPayment || loadingMemberPayments || loadingUserPayment) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!groupPayment) return null;

  const totalMembers = 5;
  const paidMembers = memberPayments?.filter(p => p.status === 'paid').length || 0;
  const userHasPaid = userPayment?.status === 'paid';
  const deadline = new Date(groupPayment.payment_deadline);
  const timeLeft = deadline.getTime() - Date.now();
  const minutesLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60)));

  const handlePayment = () => {
    if (userPayment && !userHasPaid) {
      createPayment.mutate(groupId);
    }
  };

  const handleVerifyPayments = () => {
    verifyPayments.mutate(groupId);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          {userHasPaid ? (
            <CheckCircle className="h-6 w-6 text-success" />
          ) : (
            <CreditCard className="h-6 w-6 text-primary" />
          )}
        </div>
        
        <CardTitle className="text-xl">
          {userHasPaid ? 'Paiement effectué' : 'Validation du groupe'}
        </CardTitle>
        
        <CardDescription>
          {userHasPaid 
            ? 'Votre paiement a été confirmé. En attente des autres membres.'
            : `Chaque membre doit payer ${ppuPrice.toFixed(2)}€ pour valider le groupe`
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Status */}
        <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Paiements confirmés</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={paidMembers === totalMembers ? "default" : "secondary"}
              className="font-mono"
            >
              {paidMembers}/{totalMembers}
            </Badge>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Temps restant</span>
          </div>
          <Badge 
            variant={minutesLeft < 5 ? "destructive" : "outline"}
            className="font-mono"
          >
            {minutesLeft}min
          </Badge>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Montant</span>
          </div>
          <span className="font-semibold text-lg">
            {ppuPrice.toFixed(2)}€
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!userHasPaid ? (
            <Button 
              onClick={handlePayment}
              disabled={createPayment.isPending}
              className="w-full"
              size="lg"
            >
              {createPayment.isPending ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Ouverture du paiement...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payer {ppuPrice.toFixed(2)}€
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 p-4 bg-success/10 text-success rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Votre paiement est confirmé</span>
            </div>
          )}

          {userHasPaid && paidMembers < totalMembers && (
            <Button 
              onClick={handleVerifyPayments}
              disabled={verifyPayments.isPending}
              variant="outline"
              className="w-full"
            >
              {verifyPayments.isPending ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Vérification...
                </>
              ) : (
                'Vérifier les paiements'
              )}
            </Button>
          )}
        </div>

        {minutesLeft < 5 && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              Attention : Le groupe sera annulé si tous les paiements ne sont pas effectués dans les 5 prochaines minutes.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};