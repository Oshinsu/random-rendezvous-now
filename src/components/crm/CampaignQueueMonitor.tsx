import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCampaignQueue } from "@/hooks/useCampaignQueue";
import { Mail, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function CampaignQueueMonitor() {
  const { queues, loading } = useCampaignQueue();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Queue des Campagnes
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
            <Mail className="h-5 w-5" />
            Queue des Campagnes
          </CardTitle>
          <CardDescription>Aucune campagne en cours d'envoi</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les campagnes avec plus de 10 destinataires utilisent le système de queue
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Queue des Campagnes
        </CardTitle>
        <CardDescription>
          Envoi en cours: {queues.filter(q => q.status === 'sending').length} campagne(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {queues.map((queue) => {
          const progress = (queue.processed / queue.total) * 100;
          const remainingMinutes = Math.ceil((queue.total - queue.processed) / 5);

          return (
            <div key={queue.campaignId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {queue.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-success" />
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
