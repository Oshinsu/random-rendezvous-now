import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingDown, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface FunnelData {
  stage: string;
  stage_order: number;
  count: number;
  avg_hours_in_stage: number;
  previous_count: number;
  drop_off_rate: number;
}

interface GroupsFunnelChartProps {
  data: FunnelData[];
}

const STAGE_LABELS: Record<string, string> = {
  created: 'Créés',
  waiting: 'En attente',
  confirmed: 'Confirmés',
  completed: 'Complétés',
};

const STAGE_COLORS: Record<string, string> = {
  created: 'bg-primary',
  waiting: 'bg-yellow-500',
  confirmed: 'bg-green-500',
  completed: 'bg-blue-500',
};

export const GroupsFunnelChart = ({ data }: GroupsFunnelChartProps) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const getDropOffStatus = (rate: number) => {
    if (rate >= 50) return { icon: AlertTriangle, color: 'text-red-500', label: 'CRITICAL', variant: 'destructive' as const };
    if (rate >= 25) return { icon: TrendingDown, color: 'text-orange-500', label: 'WARNING', variant: 'default' as const };
    return { icon: CheckCircle2, color: 'text-green-500', label: 'HEALTHY', variant: 'secondary' as const };
  };

  const criticalStages = data.filter(d => d.drop_off_rate >= 50);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Funnel de Conversion</h3>
          <p className="text-sm text-muted-foreground">Analyse du parcours - 30 derniers jours</p>
        </div>
        {criticalStages.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {criticalStages.length} étape{criticalStages.length > 1 ? 's' : ''} critique{criticalStages.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Alertes critiques */}
      {criticalStages.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Drop-off critique détecté :</strong>{' '}
            {criticalStages.map(s => `${STAGE_LABELS[s.stage]} (-${s.drop_off_rate}%)`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Funnel visuel */}
      <div className="space-y-4">
        {data.map((stage, index) => {
          const width = (stage.count / maxCount) * 100;
          const status = stage.drop_off_rate ? getDropOffStatus(stage.drop_off_rate) : null;
          const StatusIcon = status?.icon;

          return (
            <div key={stage.stage} className="relative">
              {/* Barre du funnel */}
              <div className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{STAGE_LABELS[stage.stage]}</span>
                    {status && StatusIcon && (
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{stage.count}</span>
                    {stage.drop_off_rate > 0 && (
                      <Badge variant={status?.variant} className="text-xs">
                        -{stage.drop_off_rate}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Barre colorée */}
                <div className="w-full h-12 bg-secondary rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full ${STAGE_COLORS[stage.stage]} transition-all duration-700 ease-out flex items-center justify-between px-4`}
                    style={{ width: `${width}%` }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {stage.count} groupes
                    </span>
                    {stage.avg_hours_in_stage > 0 && (
                      <div className="flex items-center gap-1 text-white/80 text-xs">
                        <Clock className="w-3 h-3" />
                        {stage.avg_hours_in_stage.toFixed(1)}h moy.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Flèche de transition avec drop-off */}
              {index < data.length - 1 && stage.drop_off_rate > 0 && (
                <div className="flex items-center justify-center my-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-4 w-px bg-border" />
                    <span className="px-2 py-1 rounded bg-secondary">
                      {stage.previous_count - stage.count} abandons
                    </span>
                    <div className="h-4 w-px bg-border" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Métriques globales */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {data[0]?.count || 0}
          </div>
          <div className="text-xs text-muted-foreground">Entrées totales</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {data[data.length - 1]?.count || 0}
          </div>
          <div className="text-xs text-muted-foreground">Sorties complètes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {data[0]?.count > 0 
              ? ((data[data.length - 1]?.count / data[0]?.count) * 100).toFixed(1)
              : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Taux de conversion</div>
        </div>
      </div>
    </Card>
  );
};
