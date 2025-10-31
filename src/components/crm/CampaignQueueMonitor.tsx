import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCampaignQueue } from '@/hooks/useCampaignQueue';
import { Clock, Mail, AlertCircle, CheckCircle2, Pause, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CampaignQueueMonitor() {
  const { queues, loading, refetch } = useCampaignQueue();
  const [circuitBreakerUntil, setCircuitBreakerUntil] = useState<Date | null>(null);
  const [reactivating, setReactivating] = useState(false);

  // Check circuit breaker status
  useEffect(() => {
    const checkCircuitBreaker = async () => {
      const { data } = await supabase
        .from('zoho_oauth_tokens')
        .select('circuit_breaker_until')
        .single();
      
      if (data?.circuit_breaker_until) {
        setCircuitBreakerUntil(new Date(data.circuit_breaker_until));
      } else {
        setCircuitBreakerUntil(null);
      }
    };

    checkCircuitBreaker();
    const interval = setInterval(checkCircuitBreaker, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      // Get token ID first
      const { data: tokenData } = await supabase
        .from('zoho_oauth_tokens')
        .select('id')
        .single();

      if (!tokenData) {
        throw new Error('No token found');
      }

      // Reset circuit breaker
      await supabase
        .from('zoho_oauth_tokens')
        .update({
          circuit_breaker_until: null,
          consecutive_failures: 0,
        })
        .eq('id', tokenData.id);

      // Note: CRON reactivation needs to be done via SQL
      toast.success('✅ Circuit breaker réinitialisé. Contactez un admin pour réactiver le CRON.');
      setCircuitBreakerUntil(null);
      refetch();
    } catch (error) {
      console.error('Error reactivating:', error);
      toast.error('❌ Erreur lors de la réactivation');
    } finally {
      setReactivating(false);
    }
  };

  const getTimeRemaining = () => {
    if (!circuitBreakerUntil) return null;
    const now = Date.now();
    const until = circuitBreakerUntil.getTime();
    const remaining = Math.max(0, until - now);
    const minutes = Math.ceil(remaining / 60000);
    return minutes;
  };

  const timeRemaining = getTimeRemaining();
  const isPaused = circuitBreakerUntil && circuitBreakerUntil.getTime() > Date.now();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Queue d'envoi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!queues || queues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Queue d'envoi
          </CardTitle>
          <CardDescription>Aucune campagne en cours d'envoi</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les campagnes utilisent le système de queue pour respecter les rate limits
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Queue d'envoi
              {isPaused && (
                <Badge variant="destructive" className="ml-2">
                  <Pause className="w-3 h-3 mr-1" />
                  En pause
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Progression de l'envoi des campagnes email
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPaused && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <strong>Rate limit Zoho détecté.</strong> Le système s'est mis en pause automatiquement.
                {timeRemaining && timeRemaining > 0 ? (
                  <span className="block mt-1">Réactivation possible dans {timeRemaining} minute{timeRemaining > 1 ? 's' : ''}.</span>
                ) : (
                  <span className="block mt-1">Vous pouvez maintenant réactiver l'envoi.</span>
                )}
              </div>
              {(!timeRemaining || timeRemaining <= 0) && (
                <Button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  size="sm"
                  variant="outline"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {reactivating ? 'Réactivation...' : 'Réinitialiser'}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {queues.map((queue) => {
          const progress = (queue.processed / queue.total) * 100;
          const remainingMinutes = Math.ceil((queue.total - queue.processed) / 5);

          return (
            <div key={queue.campaignId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {queue.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : queue.failed > 0 ? (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  ) : (
                    <Clock className="h-4 w-4 text-primary animate-pulse" />
                  )}
                  <span className="font-medium text-sm">
                    Campagne {queue.campaignId.slice(0, 8)}
                  </span>
                </div>
                <Badge variant={queue.status === 'completed' ? 'default' : 'secondary'}>
                  {queue.status === 'completed' ? 'Terminé' : 'En cours'}
                </Badge>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {queue.processed} / {queue.total} emails envoyés
                  {queue.failed > 0 && ` (${queue.failed} échecs)`}
                </span>
                {queue.status === 'sending' && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{remainingMinutes} min restantes
                  </span>
                )}
              </div>

              {queue.failed > 0 && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreurs détectées</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{queue.failed} email{queue.failed > 1 ? 's ont' : ' a'} échoué</span>
                    <Button 
                      variant="link" 
                      size="sm"
                      className="h-auto p-0 text-destructive hover:text-destructive/80"
                      onClick={() => window.open(`/admin/logs?search=campaign+${queue.campaignId}`, '_blank')}
                    >
                      Voir les logs →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
