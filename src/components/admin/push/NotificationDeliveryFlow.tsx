import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotificationTypeConfig } from '@/hooks/useNotificationTypesConfig';
import { Webhook, Clock, Zap, Target, Shield, Bell } from 'lucide-react';

interface NotificationDeliveryFlowProps {
  notification: NotificationTypeConfig;
}

const DELIVERY_FLOWS: Record<string, string> = {
  GROUP_CONFIRMED: `graph TD
    A[5 users join group] --> B{Group full?}
    B -->|Yes| C[Trigger group_confirmed event]
    C --> D[Call Edge Function:<br/>system-messaging]
    D --> E{Check user preferences}
    E -->|Enabled| F[Filter quiet hours<br/>22h-9h]
    E -->|Disabled| Z[Skip notification]
    F -->|Valid time| G[Check rate limit<br/>max 5/day]
    F -->|Quiet hours| Z
    G -->|Under limit| H[Call send-push-notification]
    G -->|Over limit| I[Queue for later]
    H --> J[FCM HTTP v1 API]
    J --> K{Delivery status}
    K -->|Success| L[Track in<br/>notification_analytics]
    K -->|Failure| M[Mark token inactive]
    L --> N[Record in<br/>user_notifications]`,
  
  WELCOME_FUN: `graph TD
    A[User signup] --> B[Insert in profiles]
    B --> C[Trigger send-welcome-fun]
    C --> D{Has push token?}
    D -->|Yes| E[Send immediately]
    D -->|No| F[Wait 5min]
    F --> G{Token registered?}
    G -->|Yes| E
    G -->|No| H[Skip]
    E --> I[Track welcome_sent]`,
  
  PEAK_HOURS_FOMO: `graph TD
    A[Scheduled CRON<br/>Thu-Sat 18h-20h] --> B[Find active groups]
    B --> C{>3 groups active?}
    C -->|Yes| D[Target inactive users<br/>Last seen >3 days]
    C -->|No| E[Skip]
    D --> F[Check rate limit<br/>Max 1/week]
    F -->|OK| G[Send FOMO notification]
    F -->|Rate limited| E`,
};

export const NotificationDeliveryFlow = ({ notification }: NotificationDeliveryFlowProps) => {
  const sendRules = notification.send_rules || {};
  const mermaidCode = DELIVERY_FLOWS[notification.type_key];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Règles de Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trigger Type */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Type de trigger</span>
          </div>
          <Badge variant="secondary">
            {notification.type_key.includes('SCHEDULED') ? '⏰ Scheduled' : 
             notification.type_key.includes('WELCOME') ? '🎉 Event-Based' : 
             '⚡ Real-time'}
          </Badge>
        </div>

        {/* Rate Limits */}
        {sendRules.max_per_day && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rate Limits</span>
            </div>
            <div className="text-sm space-y-1">
              <p>• Max {sendRules.max_per_day}/jour par utilisateur</p>
              {sendRules.quiet_hours_exempt ? (
                <p className="text-green-600">• Exempt des quiet hours</p>
              ) : (
                <p>• Bloquée 22h-9h (quiet hours)</p>
              )}
            </div>
          </div>
        )}

        {/* User Consent */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Targeting</span>
          </div>
          <div className="text-sm space-y-1">
            <p>• Respecte user_notification_preferences</p>
            {sendRules.requires_user_consent && (
              <p>• Requiert consentement explicite</p>
            )}
            <p>• Seulement tokens actifs (&lt; 90j)</p>
          </div>
        </div>

        {/* Delivery Flow Diagram */}
        {mermaidCode && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Flow Diagram</span>
            </div>
            <div className="p-4 bg-muted rounded-lg overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {mermaidCode}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Diagramme Mermaid - Visualise le flow d'envoi complet
            </p>
          </div>
        )}

        {/* Estimated Reach */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Portée estimée
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            ~75-85% des utilisateurs éligibles selon les filtres actuels
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
