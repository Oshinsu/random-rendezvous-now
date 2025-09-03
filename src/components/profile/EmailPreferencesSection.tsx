import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, BellRing, Calendar, Newspaper, Megaphone, UserX } from 'lucide-react';
import { useEmailPreferences } from '@/hooks/useEmailPreferences';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTranslation } from 'react-i18next';

export const EmailPreferencesSection = () => {
  const { t } = useTranslation();
  const { 
    preferences, 
    loading, 
    updating, 
    updatePreferences, 
    unsubscribeFromAll, 
    resubscribeToAll 
  } = useEmailPreferences();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Préférences Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) return null;

  const handleToggle = (key: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Préférences Email
        </CardTitle>
        <CardDescription>
          Gérez les types d'emails que vous souhaitez recevoir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferences.all_emails_disabled && (
          <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-800">
                  Vous êtes désabonné de tous les emails
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resubscribeToAll}
                disabled={updating}
              >
                Se réabonner
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="font-medium">Notifications de groupes</label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications quand de nouveaux groupes sont créés près de vous
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.group_notifications && !preferences.all_emails_disabled}
              onCheckedChange={(checked) => handleToggle('group_notifications', checked)}
              disabled={updating || preferences.all_emails_disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="font-medium">Rappels de sorties planifiées</label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des rappels pour vos sorties planifiées
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.scheduled_reminders && !preferences.all_emails_disabled}
              onCheckedChange={(checked) => handleToggle('scheduled_reminders', checked)}
              disabled={updating || preferences.all_emails_disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="font-medium">Newsletter</label>
                <p className="text-sm text-muted-foreground">
                  Recevoir notre newsletter avec les nouveautés et conseils
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.newsletter && !preferences.all_emails_disabled}
              onCheckedChange={(checked) => handleToggle('newsletter', checked)}
              disabled={updating || preferences.all_emails_disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <label className="font-medium">Emails marketing</label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des informations sur nos nouveaux services et promotions
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.marketing_emails && !preferences.all_emails_disabled}
              onCheckedChange={(checked) => handleToggle('marketing_emails', checked)}
              disabled={updating || preferences.all_emails_disabled}
            />
          </div>
        </div>

        {!preferences.all_emails_disabled && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={unsubscribeFromAll}
              disabled={updating}
              className="w-full"
            >
              Se désabonner de tous les emails
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};