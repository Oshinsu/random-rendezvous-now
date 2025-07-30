import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { useState } from 'react';

export const RateLimitNotification = () => {
  const { rateLimitStatus, forceReconnect } = useAuth();
  const [isReconnecting, setIsReconnecting] = useState(false);

  if (!rateLimitStatus.isBlocked) {
    return null;
  }

  const handleForceReconnect = async () => {
    if (!rateLimitStatus.canRetry) return;
    
    setIsReconnecting(true);
    try {
      await forceReconnect();
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Limite de connexion atteinte
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <div className="space-y-2">
          <p>
            Trop de tentatives de connexion. Veuillez attendre{' '}
            <span className="font-semibold">
              {rateLimitStatus.remainingSeconds} secondes
            </span>{' '}
            avant de réessayer.
          </p>
          
          {rateLimitStatus.remainingSeconds > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3" />
              <span>Temps restant: {rateLimitStatus.remainingSeconds}s</span>
            </div>
          )}
          
          {rateLimitStatus.canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceReconnect}
              disabled={isReconnecting}
              className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900"
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                  Reconnexion...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Forcer la reconnexion
                </>
              )}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};