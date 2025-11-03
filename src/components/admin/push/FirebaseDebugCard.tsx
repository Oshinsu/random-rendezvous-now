import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const FirebaseDebugCard = () => {
  const { data: debugInfo, isLoading } = useQuery({
    queryKey: ['firebase-debug'],
    queryFn: async () => {
      // Check VAPID key from .env
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY;

      // Check Service Account status (we assume valid if VAPID key is set)
      // Note: We cannot test the edge function without a valid user_id
      let serviceAccountStatus = 'unknown';
      try {
        // Check if Firebase secrets are configured by checking edge function availability
        // We don't actually invoke it to avoid errors
        const functionsUrl = `https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-push-notification`;
        const response = await fetch(functionsUrl, {
          method: 'OPTIONS', // Just check if function exists
        });
        
        if (response.ok) {
          serviceAccountStatus = 'configured'; // Function exists
        } else {
          serviceAccountStatus = 'unknown';
        }
      } catch (err) {
        serviceAccountStatus = 'error';
      }

      // Get recent edge function errors (simplified - in production you'd query logs)
      const { data: recentNotifs } = await supabase
        .from('user_notifications')
        .select('type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const projectId = 'random-app'; // From your Firebase project

      return {
        vapidConfigured: !!vapidKey,
        vapidKey: vapidKey || 'Not configured',
        serviceAccountStatus,
        projectId,
        recentActivity: recentNotifs || [],
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500">✅ Valide</Badge>;
      case 'invalid':
        return <Badge variant="destructive">❌ Invalide</Badge>;
      default:
        return <Badge variant="secondary">⚠️ Inconnu</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Firebase Debug Dashboard
        </CardTitle>
        <CardDescription>
          Diagnostic en temps réel de la configuration Firebase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* VAPID Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon(debugInfo?.vapidConfigured ? 'valid' : 'invalid')}
              VAPID Public Key
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {debugInfo?.vapidConfigured 
                ? `${String(debugInfo?.vapidKey).slice(0, 20)}...` 
                : 'Non configurée'}
            </p>
          </div>
          {getStatusBadge(debugInfo?.vapidConfigured ? 'valid' : 'invalid')}
        </div>

        <Separator />

        {/* Service Account Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon(debugInfo?.serviceAccountStatus || 'unknown')}
              Service Account JSON
            </p>
            <p className="text-xs text-muted-foreground">
              Configuration edge function FCM
            </p>
          </div>
          {getStatusBadge(debugInfo?.serviceAccountStatus || 'unknown')}
        </div>

        <Separator />

        {/* Project ID */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Firebase Project ID</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {debugInfo?.projectId}
            </code>
            <Button variant="ghost" size="sm" className="h-6" asChild>
              <a
                href={`https://console.firebase.google.com/project/${debugInfo?.projectId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Recent Activity */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Activité récente</p>
          {debugInfo?.recentActivity && debugInfo.recentActivity.length > 0 ? (
            <div className="space-y-1">
              {debugInfo.recentActivity.slice(0, 3).map((notif, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="font-mono">
                    {notif.type}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(notif.created_at).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Aucune notification récente</p>
          )}
        </div>

        <Separator />

        {/* Quick Links */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Firebase Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
            <a
              href={`https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/functions/send-push-notification/logs`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Edge Logs
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
