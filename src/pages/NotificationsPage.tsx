import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, BellOff, Settings, Volume2, VolumeX, 
  Clock, MessageSquare, Gift, Users, Building, Megaphone,
  CheckCircle2, Info
} from 'lucide-react';
import { PushPermissionModal } from '@/components/PushPermissionModal';
import { PushBrowserHelp } from '@/components/PushBrowserHelp';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { status, isEnabled, requestPermission } = usePushNotifications();
  const { preferences, loading, updatePreference } = useNotificationPreferences();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showBrowserHelp, setShowBrowserHelp] = useState(false);

  const handleMainToggle = async () => {
    if (!isEnabled && status.permission === 'default') {
      setShowPermissionModal(true);
    } else if (!isEnabled && status.permission === 'denied') {
      setShowBrowserHelp(true);
    } else if (isEnabled) {
      await updatePreference('enabled', false);
    } else {
      await updatePreference('enabled', true);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Personnalise comment Random te tient au courant
          </p>
        </div>

        {/* Section 1 : Statut Global */}
        <Card className="border-brand-200/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  {isEnabled ? (
                    <Bell className="h-5 w-5 text-green-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-gray-400" />
                  )}
                  Notifications Push
                </CardTitle>
                <CardDescription>
                  {isEnabled && preferences?.enabled ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Actives • Tu recevras les notifications importantes
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      Désactivées • Tu risques de rater des infos importantes
                    </span>
                  )}
                </CardDescription>
              </div>
              <Switch
                checked={isEnabled && preferences?.enabled}
                onCheckedChange={handleMainToggle}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </CardHeader>

          {!isEnabled && status.permission === 'denied' && (
            <CardContent>
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Les notifications sont bloquées dans ton navigateur. 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-1" 
                    onClick={() => setShowBrowserHelp(true)}
                  >
                    Voir comment les réactiver →
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* Section 2 : Types de Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Types de notifications
            </CardTitle>
            <CardDescription>
              Choisis ce que tu veux recevoir (ou pas)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Groupes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand-600" />
                <div>
                  <Label className="font-semibold">Groupes</Label>
                  <p className="text-sm text-muted-foreground">
                    Confirmations, formations, rappels de sorties
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.groups_notifications ?? true}
                onCheckedChange={(checked) => updatePreference('groups_notifications', checked)}
                disabled={!preferences?.enabled}
              />
            </div>

            <Separator />

            {/* Bars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-amber-600" />
                <div>
                  <Label className="font-semibold">Bars</Label>
                  <p className="text-sm text-muted-foreground">
                    Assignations, nouveaux spots près de toi
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.bars_notifications ?? true}
                onCheckedChange={(checked) => updatePreference('bars_notifications', checked)}
                disabled={!preferences?.enabled}
              />
            </div>

            <Separator />

            {/* Lifecycle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-purple-600" />
                <div>
                  <Label className="font-semibold">Aventure</Label>
                  <p className="text-sm text-muted-foreground">
                    Welcome, first win, comeback, récompenses
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.lifecycle_notifications ?? true}
                onCheckedChange={(checked) => updatePreference('lifecycle_notifications', checked)}
                disabled={!preferences?.enabled}
              />
            </div>

            <Separator />

            {/* Messages */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="font-semibold">Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Nouveaux messages dans tes groupes
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.messages_notifications ?? true}
                onCheckedChange={(checked) => updatePreference('messages_notifications', checked)}
                disabled={!preferences?.enabled}
              />
            </div>

            <Separator />

            {/* Promotions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-red-600" />
                <div>
                  <Label className="font-semibold">Promotions</Label>
                  <p className="text-sm text-muted-foreground">
                    Offres spéciales, événements Random
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences?.promotions_notifications ?? false}
                onCheckedChange={(checked) => updatePreference('promotions_notifications', checked)}
                disabled={!preferences?.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3 : Paramètres Avancés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Paramètres avancés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiet Hours */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <Label className="font-semibold">Heures de silence</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Aucune notification entre {preferences?.quiet_hours_start}h et {preferences?.quiet_hours_end}h
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Début</Label>
                  <Slider
                    value={[Number(preferences?.quiet_hours_start ?? 22)]}
                    onValueChange={([value]) => updatePreference('quiet_hours_start', value)}
                    min={0}
                    max={23}
                    step={1}
                    disabled={!preferences?.enabled}
                  />
                  <span className="text-xs text-muted-foreground">{preferences?.quiet_hours_start}h00</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fin</Label>
                  <Slider
                    value={[Number(preferences?.quiet_hours_end ?? 9)]}
                    onValueChange={([value]) => updatePreference('quiet_hours_end', value)}
                    min={0}
                    max={23}
                    step={1}
                    disabled={!preferences?.enabled}
                  />
                  <span className="text-xs text-muted-foreground">{preferences?.quiet_hours_end}h00</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Max par jour */}
            <div className="space-y-3">
              <Label className="font-semibold">Fréquence maximale</Label>
              <p className="text-sm text-muted-foreground">
                Maximum {preferences?.max_per_day ?? 5} notifications par jour
              </p>
              <Slider
                value={[Number(preferences?.max_per_day ?? 5)]}
                onValueChange={([value]) => updatePreference('max_per_day', value)}
                min={1}
                max={20}
                step={1}
                disabled={!preferences?.enabled}
              />
            </div>

            <Separator />

            {/* Sons & Vibrations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {preferences?.sound_enabled ? (
                    <Volume2 className="h-5 w-5 text-blue-600" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <Label className="font-semibold">Sons</Label>
                    <p className="text-sm text-muted-foreground">
                      Jouer un son à la réception
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.sound_enabled ?? true}
                  onCheckedChange={(checked) => updatePreference('sound_enabled', checked)}
                  disabled={!preferences?.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full ${preferences?.vibration_enabled ? 'bg-purple-600 animate-pulse' : 'bg-gray-400'}`} />
                  <div>
                    <Label className="font-semibold">Vibrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Vibrer sur mobile
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences?.vibration_enabled ?? true}
                  onCheckedChange={(checked) => updatePreference('vibration_enabled', checked)}
                  disabled={!preferences?.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showPermissionModal && (
        <PushPermissionModal 
          trigger="first_visit"
          onClose={() => setShowPermissionModal(false)}
        />
      )}
      <PushBrowserHelp 
        isOpen={showBrowserHelp}
        onClose={() => setShowBrowserHelp(false)}
      />
    </AppLayout>
  );
}
