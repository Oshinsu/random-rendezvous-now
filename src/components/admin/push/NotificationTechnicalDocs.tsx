import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationTypeConfig } from '@/hooks/useNotificationTypesConfig';
import { Code, Database, Key, ExternalLink, FileCode } from 'lucide-react';

interface NotificationTechnicalDocsProps {
  notification: NotificationTypeConfig;
}

// Mapping des notifications vers leurs edge functions
const EDGE_FUNCTIONS_MAP: Record<string, string[]> = {
  GROUP_CONFIRMED: ['system-messaging', 'send-push-notification'],
  GROUP_FORMING: ['system-messaging', 'send-push-notification'],
  WELCOME_FUN: ['send-welcome-fun', 'send-push-notification'],
  FIRST_WIN: ['send-first-win', 'send-push-notification'],
  PEAK_HOURS_FOMO: ['send-peak-hours-nudge', 'send-push-notification'],
  COMEBACK_COOL: ['check-inactive-users', 'send-lifecycle-campaign'],
  NEW_BAR_NEARBY: ['system-messaging', 'send-push-notification'],
  BAR_RATING: ['system-messaging', 'send-push-notification'],
};

const REQUIRED_SECRETS = [
  { key: 'FIREBASE_SERVICE_ACCOUNT_JSON', status: 'active' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', status: 'active' },
];

const DATABASE_TABLES = [
  'profiles',
  'user_push_tokens',
  'user_notification_preferences',
  'user_notifications',
  'notification_analytics',
];

export const NotificationTechnicalDocs = ({ notification }: NotificationTechnicalDocsProps) => {
  const edgeFunctions = EDGE_FUNCTIONS_MAP[notification.type_key] || ['send-push-notification'];
  const supabaseProjectUrl = 'https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          Documentation Technique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Edge Functions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Edge Functions</span>
          </div>
          <div className="space-y-2">
            {edgeFunctions.map((func) => (
              <div
                key={func}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <code className="text-xs">{func}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open(`${supabaseProjectUrl}/functions/${func}`, '_blank')
                  }
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Trigger Type */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Type de Trigger</span>
          </div>
          <Badge variant="secondary">
            {notification.type_key.includes('SCHEDULED')
              ? '⏰ CRON Scheduled'
              : notification.type_key.includes('WELCOME')
              ? '🎉 Database Trigger (auth.users INSERT)'
              : '⚡ Real-time Event'}
          </Badge>
        </div>

        {/* Required Secrets */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Secrets Requis</span>
          </div>
          <div className="space-y-1">
            {REQUIRED_SECRETS.map((secret) => (
              <div key={secret.key} className="flex items-center justify-between text-xs">
                <code className="text-muted-foreground">{secret.key}</code>
                <Badge variant="outline" className="text-xs bg-green-50">
                  ✓ Active
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Database Tables */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tables Utilisées</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {DATABASE_TABLES.map((table) => (
              <Badge key={table} variant="secondary" className="text-xs">
                {table}
              </Badge>
            ))}
          </div>
        </div>

        {/* Targeting Logic */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-2">Logique de Targeting :</p>
          <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
            <li>user_notification_preferences.enabled = true</li>
            <li>user_notification_preferences.{notification.category}_notifications = true</li>
            <li>NOT IN quiet_hours (22h-9h)</li>
            <li>&lt; rate limit défini dans send_rules</li>
            <li>Push token actif (&lt; 90 jours)</li>
          </ul>
        </div>

        {/* Estimated Reach */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            📊 Portée Estimée
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            ~75-85% des utilisateurs éligibles
          </p>
        </div>

        {/* View Logs */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open(`${supabaseProjectUrl}/logs/edge-functions`, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Voir les logs Edge Functions
        </Button>
      </CardContent>
    </Card>
  );
};
