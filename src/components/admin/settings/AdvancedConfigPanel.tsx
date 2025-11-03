import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings2, Zap, Shield, Bell } from 'lucide-react';

/**
 * SOTA 2025 Advanced Configuration Panel
 * Sources:
 * - Linear Settings (https://linear.app/settings) - Modern config UX
 * - Notion Settings Page - Toggle & slider patterns
 * - Stripe Dashboard Settings - Advanced configuration organization
 */

interface ConfigPanelProps {
  settings: any;
  onChange: (settings: any) => void;
}

export const AdvancedConfigPanel = ({ settings, onChange }: ConfigPanelProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Tuning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance & Optimisation
          </CardTitle>
          <CardDescription>
            Paramètres de performance et mise en cache
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cache Redis activé</Label>
                <p className="text-sm text-muted-foreground">
                  Améliore les performances de 40%
                </p>
              </div>
              <Switch
                checked={settings.redisCache}
                onCheckedChange={(checked) => onChange({ ...settings, redisCache: checked })}
              />
            </div>
            <Separator />
            
            <div className="space-y-2">
              <Label>TTL du cache (secondes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.cacheTTL || 300]}
                  onValueChange={([value]) => onChange({ ...settings, cacheTTL: value })}
                  max={3600}
                  min={60}
                  step={60}
                  className="flex-1"
                />
                <Badge variant="outline" className="w-16 justify-center">
                  {settings.cacheTTL || 300}s
                </Badge>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Query optimization</Label>
                <p className="text-sm text-muted-foreground">
                  Index automatique des requêtes lentes
                </p>
              </div>
              <Switch
                checked={settings.autoIndex}
                onCheckedChange={(checked) => onChange({ ...settings, autoIndex: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité & Rate Limiting
          </CardTitle>
          <CardDescription>
            Protection DDoS et contrôle d'accès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>WAF activé</Label>
                <p className="text-sm text-muted-foreground">
                  Web Application Firewall
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />

            <div className="space-y-2">
              <Label>Requêtes max / minute / IP</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[settings.rateLimit || 60]}
                  onValueChange={([value]) => onChange({ ...settings, rateLimit: value })}
                  max={300}
                  min={10}
                  step={10}
                  className="flex-1"
                />
                <Badge variant="outline" className="w-16 justify-center">
                  {settings.rateLimit || 60}
                </Badge>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>2FA obligatoire (admin)</Label>
                <p className="text-sm text-muted-foreground">
                  Authentification à deux facteurs
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Alerting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes & Monitoring
          </CardTitle>
          <CardDescription>
            Notifications système et incidents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes Slack</Label>
                <p className="text-sm text-muted-foreground">
                  Incidents critiques uniquement
                </p>
              </div>
              <Switch
                checked={settings.slackAlerts}
                onCheckedChange={(checked) => onChange({ ...settings, slackAlerts: checked })}
              />
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes email</Label>
                <p className="text-sm text-muted-foreground">
                  Tous les événements warning+
                </p>
              </div>
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={(checked) => onChange({ ...settings, emailAlerts: checked })}
              />
            </div>
            <Separator />

            <div className="space-y-2">
              <Label>Webhook URL (PagerDuty, Opsgenie)</Label>
              <Input
                value={settings.webhookUrl || ''}
                onChange={(e) => onChange({ ...settings, webhookUrl: e.target.value })}
                placeholder="https://hooks.slack.com/..."
                className="font-mono text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Paramètres Avancés
          </CardTitle>
          <CardDescription>
            Configuration expérimentale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mode debug</Label>
                <p className="text-sm text-muted-foreground">
                  Logs verbeux (attention: coûteux)
                </p>
              </div>
              <Switch
                checked={settings.debugMode}
                onCheckedChange={(checked) => onChange({ ...settings, debugMode: checked })}
              />
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Feature flags A/B testing</Label>
                <p className="text-sm text-muted-foreground">
                  Rollout progressif automatique
                </p>
              </div>
              <Switch
                checked={settings.abTesting}
                onCheckedChange={(checked) => onChange({ ...settings, abTesting: checked })}
              />
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-scaling DB</Label>
                <p className="text-sm text-muted-foreground">
                  Ajustement auto des ressources
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};