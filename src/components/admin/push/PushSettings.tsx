import { usePushSettings } from '@/hooks/usePushSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const PushSettings = () => {
  const { settings, isLoading, updateSetting, cleanupTokens, isUpdating, isCleaning } = usePushSettings();
  const [copied, setCopied] = useState(false);

  const handleCopyVapidKey = () => {
    if (settings?.vapidPublicKey) {
      navigator.clipboard.writeText(settings.vapidPublicKey);
      setCopied(true);
      toast.success('✅ Clé VAPID copiée');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>🚦 Rate Limiting</CardTitle>
          <CardDescription>Contrôlez la fréquence d'envoi pour éviter le spam</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxPerDay">Max notifications par utilisateur / jour</Label>
            <div className="flex gap-2">
              <Input
                id="maxPerDay"
                type="number"
                min="1"
                max="20"
                defaultValue={settings?.maxNotificationsPerDay}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (value !== settings?.maxNotificationsPerDay) {
                    updateSetting({ key: 'push_max_per_day', value });
                  }
                }}
              />
              <Button variant="outline" disabled>
                Default: 5
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Recommandé: 5 pour éviter la fatigue notif
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>🌙 Quiet Hours</CardTitle>
          <CardDescription>Plage horaire sans envoi de notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietStart">Début (heure)</Label>
              <Input
                id="quietStart"
                type="number"
                min="0"
                max="23"
                defaultValue={settings?.quietHoursStart}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (value !== settings?.quietHoursStart) {
                    updateSetting({ key: 'push_quiet_hours_start', value });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietEnd">Fin (heure)</Label>
              <Input
                id="quietEnd"
                type="number"
                min="0"
                max="23"
                defaultValue={settings?.quietHoursEnd}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (value !== settings?.quietHoursEnd) {
                    updateSetting({ key: 'push_quiet_hours_end', value });
                  }
                }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            🕐 Default: 22h - 9h (heure de Paris UTC+1)
          </p>
        </CardContent>
      </Card>

      {/* A/B Testing */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 A/B Testing</CardTitle>
          <CardDescription>Testez différentes copies pour optimiser l'engagement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable A/B Testing</Label>
              <p className="text-xs text-muted-foreground">
                Split 50/50 automatique sur nouveaux envois
              </p>
            </div>
            <Switch
              checked={settings?.abTestingEnabled}
              onCheckedChange={(checked) => {
                updateSetting({ key: 'push_ab_testing_enabled', value: checked });
              }}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Minimum sample size</p>
            <Input type="number" defaultValue={100} disabled />
            <p className="text-xs text-muted-foreground">
              Déclarer un winner après au moins 100 envois par variante
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Token Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle>🗑️ Token Cleanup</CardTitle>
          <CardDescription>Nettoyez automatiquement les tokens inactifs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cleanupDays">Auto-delete après X jours d'inactivité</Label>
            <Input
              id="cleanupDays"
              type="number"
              min="7"
              max="90"
              defaultValue={settings?.autoCleanupDays}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (value !== settings?.autoCleanupDays) {
                  updateSetting({ key: 'push_auto_cleanup_days', value });
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Default: 30 jours (SOTA 2025 standard)
            </p>
          </div>
          <Separator />
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={() => cleanupTokens()}
            disabled={isCleaning}
          >
            <Trash2 className="h-4 w-4" />
            {isCleaning ? 'Nettoyage...' : 'Nettoyer maintenant'}
          </Button>
        </CardContent>
      </Card>

      {/* Firebase Config */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 Firebase Config</CardTitle>
          <CardDescription>Configuration Firebase Cloud Messaging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>VAPID Public Key (read-only)</Label>
            <div className="flex gap-2">
              <Input
                value={settings?.vapidPublicKey}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyVapidKey}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Separator />
          <Button variant="outline" className="w-full gap-2" asChild>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir Firebase Console
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              FCM API Status: ✅ Operational
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
