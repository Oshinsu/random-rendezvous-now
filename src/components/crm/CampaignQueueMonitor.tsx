import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCampaignQueue } from '@/hooks/useCampaignQueue';
import { useCampaignSystemStatus } from '@/hooks/useCampaignSystemStatus';
import { Clock, Mail, AlertCircle, CheckCircle2, Pause, Play, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function CampaignQueueMonitor() {
  const { queues, loading, refetch } = useCampaignQueue();
  const systemStatus = useCampaignSystemStatus();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handlePauseQueue = async () => {
    setActionLoading('pause');
    try {
      const { error } = await supabase.functions.invoke('pause-campaign-queue');
      if (error) throw error;
      toast.success('✅ Envois mis en pause');
      refetch();
      systemStatus.refetch();
    } catch (error) {
      console.error('Error pausing queue:', error);
      toast.error('❌ Erreur lors de la pause');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeQueue = async () => {
    setActionLoading('resume');
    try {
      const { data, error } = await supabase.functions.invoke('resume-campaign-queue');
      if (error) throw error;
      toast.success('✅ Envois repris');
      refetch();
      systemStatus.refetch();
    } catch (error: any) {
      console.error('Error resuming queue:', error);
      toast.error(error.message || '❌ Erreur lors de la reprise');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCircuitBreaker = async () => {
    setActionLoading('reset');
    try {
      const { data: tokenData } = await supabase
        .from('zoho_oauth_tokens')
        .select('id')
        .single();

      if (!tokenData) {
        throw new Error('Token non trouvé');
      }

      await supabase
        .from('zoho_oauth_tokens')
        .update({
          circuit_breaker_until: null,
          consecutive_failures: 0,
        })
        .eq('id', tokenData.id);

      toast.success('✅ Circuit breaker réinitialisé');
      systemStatus.refetch();
    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
      toast.error('❌ Erreur lors de la réinitialisation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm('Voulez-vous vraiment vider la queue ? Cette action est irréversible.')) {
      return;
    }

    setActionLoading('clear');
    try {
      const { error } = await supabase
        .from('campaign_email_queue')
        .delete()
        .in('status', ['paused', 'failed']);

      if (error) throw error;
      toast.success('✅ Queue vidée');
      refetch();
    } catch (error) {
      console.error('Error clearing queue:', error);
      toast.error('❌ Erreur lors du nettoyage');
    } finally {
      setActionLoading(null);
    }
  };

  const getTimeRemaining = () => {
    if (!systemStatus.circuitBreakerUntil) return null;
    const now = Date.now();
    const until = systemStatus.circuitBreakerUntil.getTime();
    const remaining = Math.max(0, until - now);
    const minutes = Math.ceil(remaining / 60000);
    return minutes;
  };

  const timeRemaining = getTimeRemaining();
  
  // Calculate total stats
  const totalSent = queues.reduce((sum, q) => sum + q.processed, 0);
  const totalToSend = queues.reduce((sum, q) => sum + q.total, 0);
  const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0);
  const successRate = totalSent > 0 ? ((totalSent - totalFailed) / totalSent * 100).toFixed(1) : '0';
  
  const getStatusBadge = () => {
    switch (systemStatus.status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">🟢 Actif</Badge>;
      case 'paused':
        return <Badge variant="secondary">🟡 En pause</Badge>;
      case 'error':
        return <Badge variant="destructive">🔴 Erreur</Badge>;
      default:
        return <Badge variant="outline">⏳ Chargement...</Badge>;
    }
  };

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
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5" />
              Queue d'envoi
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              {systemStatus.errorMessage || 'Système de queue pour respecter les rate limits Zoho'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {systemStatus.hasActiveQueues && queues.some(q => q.status === 'sending') && (
              <Button
                onClick={handlePauseQueue}
                disabled={actionLoading === 'pause'}
                size="sm"
                variant="destructive"
              >
                <Pause className="w-4 h-4 mr-2" />
                {actionLoading === 'pause' ? 'Pause...' : 'Arrêter'}
              </Button>
            )}
            {systemStatus.oauthConfigured && !systemStatus.circuitBreakerActive && (
              <Button
                onClick={handleResumeQueue}
                disabled={actionLoading === 'resume'}
                size="sm"
                variant="default"
              >
                <Play className="w-4 h-4 mr-2" />
                {actionLoading === 'resume' ? 'Reprise...' : 'Reprendre'}
              </Button>
            )}
            {systemStatus.circuitBreakerActive && (
              <Button
                onClick={handleResetCircuitBreaker}
                disabled={actionLoading === 'reset' || (timeRemaining && timeRemaining > 0)}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {actionLoading === 'reset' ? 'Reset...' : 'Reset CB'}
              </Button>
            )}
            {queues.length > 0 && (
              <Button
                onClick={handleClearQueue}
                disabled={actionLoading === 'clear'}
                size="sm"
                variant="outline"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Vider
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global Stats */}
        {totalToSend > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSent}/{totalToSend}</div>
              <div className="text-xs text-muted-foreground">Total envoyés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{successRate}%</div>
              <div className="text-xs text-muted-foreground">Taux de succès</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{totalFailed}</div>
              <div className="text-xs text-muted-foreground">Échecs</div>
            </div>
          </div>
        )}

        {/* Circuit Breaker Alert */}
        {systemStatus.circuitBreakerActive && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Circuit breaker activé.</strong> Rate limit Zoho détecté.
              {timeRemaining && timeRemaining > 0 ? (
                <span className="block mt-1">Réactivation possible dans {timeRemaining} minute{timeRemaining > 1 ? 's' : ''}.</span>
              ) : (
                <span className="block mt-1">Vous pouvez maintenant réinitialiser.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* OAuth Not Configured */}
        {!systemStatus.oauthConfigured && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration requise</AlertTitle>
            <AlertDescription>
              Le token OAuth Zoho n'est pas configuré. Consultez la documentation ZOHO_INTEGRATION.md
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
