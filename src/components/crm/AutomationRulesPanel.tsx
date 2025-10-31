import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRMAutomation } from '@/hooks/useCRMAutomation';
import { useCRMCampaigns } from '@/hooks/useCRMCampaigns';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Plus, Trash2, Clock, Target, Activity } from 'lucide-react';
import { useState } from 'react';

export const AutomationRulesPanel = () => {
  const { rules, loading, toggleRuleStatus, createRule, deleteRule } = useCRMAutomation();
  const { campaigns } = useCRMCampaigns();
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    trigger_type: 'lifecycle_change' as const,
    trigger_condition: {},
    campaign_id: '',
    delay_minutes: 0,
    priority: 5
  });

  const handleCreateRule = async () => {
    try {
      await createRule(newRule);
      setIsCreating(false);
      setNewRule({
        rule_name: '',
        trigger_type: 'lifecycle_change',
        trigger_condition: {},
        campaign_id: '',
        delay_minutes: 0,
        priority: 5
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Automation Marketing
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Déclenchez automatiquement des campagnes selon le comportement utilisateur
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? 'Annuler' : 'Nouvelle Règle'}
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="font-semibold mb-1">Automation Marketing Intelligente (SOTA 2025)</h4>
            <p className="text-sm text-muted-foreground">
              Les règles d'automation surveillent en temps réel les changements de comportement 
              (lifecycle, segments, health score) et déclenchent automatiquement les campagnes adaptées. 
              Source: Intercom Automation Workflows 2025.
            </p>
          </div>
        </div>
      </Card>

      {/* Creation Form */}
      {isCreating && (
        <Card className="p-6 border-primary">
          <h3 className="text-lg font-bold mb-4">Créer une Règle d'Automation</h3>
          <div className="space-y-4">
            <div>
              <Label>Nom de la règle</Label>
              <Input
                value={newRule.rule_name}
                onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                placeholder="Ex: Relance utilisateurs churned"
              />
            </div>
            <div>
              <Label>Type de déclencheur</Label>
              <Select
                value={newRule.trigger_type}
                onValueChange={(value: any) => setNewRule({ ...newRule, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifecycle_change">Changement de lifecycle</SelectItem>
                  <SelectItem value="segment_entry">Entrée dans un segment</SelectItem>
                  <SelectItem value="health_threshold">Seuil de health score</SelectItem>
                  <SelectItem value="inactivity">Inactivité prolongée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campagne à envoyer</Label>
              <Select
                value={newRule.campaign_id}
                onValueChange={(value) => setNewRule({ ...newRule, campaign_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une campagne" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.campaign_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Délai avant envoi (minutes)</Label>
              <Input
                type="number"
                value={newRule.delay_minutes}
                onChange={(e) => setNewRule({ ...newRule, delay_minutes: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0 = envoi immédiat
              </p>
            </div>
            <div>
              <Label>Priorité (1-10)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={handleCreateRule}
                disabled={!newRule.rule_name || !newRule.campaign_id}
                className="flex-1"
              >
                Créer la Règle
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="p-12 text-center">
          <Zap className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune règle d'automation</p>
          <p className="text-sm text-muted-foreground mt-2">
            Créez votre première règle pour automatiser vos campagnes
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleRuleStatus(rule.id, checked)}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        {rule.rule_name}
                        {rule.is_active ? (
                          <Badge className="bg-green-500">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                        {rule.is_active && !rule.campaign_id && (
                          <Badge variant="destructive" className="animate-pulse">
                            ⚠️ Pas de campagne
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {rule.campaign?.campaign_name || (
                          <span className="text-orange-500 font-medium">
                            ⚠️ Aucune campagne assignée - Cette règle ne peut pas s'exécuter
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Trigger: <span className="font-medium text-foreground">{rule.trigger_type}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Délai: <span className="font-medium text-foreground">
                          {rule.delay_minutes === 0 ? 'Immédiat' : `${rule.delay_minutes}min`}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Priorité: <span className="font-medium text-foreground">{rule.priority}/10</span>
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Supprimer cette règle ?')) {
                      deleteRule(rule.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {rules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Règles Actives</p>
            <p className="text-2xl font-bold">
              {rules.filter(r => r.is_active).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Règles Totales</p>
            <p className="text-2xl font-bold">{rules.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Envois Automatiques</p>
            <p className="text-2xl font-bold text-green-500">24/7</p>
          </Card>
        </div>
      )}
    </div>
  );
};