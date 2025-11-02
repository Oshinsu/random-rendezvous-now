import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, Flag } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export const FeatureFlagsManager = () => {
  const { flags, loading, updateFlag, createFlag } = useFeatureFlags();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Feature Flags</h3>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Flag
        </Button>
      </div>

      <div className="space-y-4">
        {flags.map((flag) => (
          <Card key={flag.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{flag.flag_name}</h4>
                  <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {flag.description || 'No description'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Key: {flag.flag_key}
                </p>
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={(checked) => updateFlag(flag.id, { enabled: checked })}
              />
            </div>

            {flag.enabled && (
              <div className="pt-3 border-t">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Rollout Percentage</span>
                      <span className="text-sm font-medium">{flag.rollout_percentage}%</span>
                    </div>
                    <Slider
                      value={[flag.rollout_percentage]}
                      onValueChange={([value]) => updateFlag(flag.id, { rollout_percentage: value })}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">0%</span>
                      <span className="text-xs text-muted-foreground">100%</span>
                    </div>
                  </div>

                  {flag.target_segments && flag.target_segments.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Target Segments</div>
                      <div className="flex flex-wrap gap-1">
                        {flag.target_segments.map((segment) => (
                          <Badge key={segment} variant="outline" className="text-xs">
                            {segment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}

        {flags.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flag className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No feature flags yet</p>
            <p className="text-xs">Create your first feature flag to enable gradual rollouts</p>
          </div>
        )}
      </div>
    </Card>
  );
};
