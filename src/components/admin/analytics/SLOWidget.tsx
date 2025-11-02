import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SLOWidgetProps {
  target: string;
  current: string;
  breaches: number;
  period?: string;
}

export const SLOWidget = ({ target, current, breaches, period = '30d' }: SLOWidgetProps) => {
  const targetValue = parseFloat(target.replace('%', ''));
  const currentValue = parseFloat(current.replace('%', ''));
  const isMet = currentValue >= targetValue;
  const errorBudget = 100 - targetValue;
  const errorBudgetUsed = 100 - currentValue;
  const errorBudgetRemaining = Math.max(0, errorBudget - errorBudgetUsed);
  const errorBudgetPercentage = (errorBudgetRemaining / errorBudget) * 100;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">SLO Status</h3>
        </div>
        <Badge variant={isMet ? "default" : "destructive"}>
          {isMet ? '✓ Met' : '✗ Breached'}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Uptime ({period})</span>
            <span className="text-2xl font-bold text-primary">{current}</span>
          </div>
          <Progress value={currentValue} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Target: {target}</span>
            <span className="text-xs text-muted-foreground">
              {isMet ? `+${(currentValue - targetValue).toFixed(2)}%` : `${(currentValue - targetValue).toFixed(2)}%`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Error Budget</div>
            <div className="text-xl font-semibold">
              {errorBudgetPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {errorBudgetRemaining.toFixed(2)}% remaining
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Breaches
            </div>
            <div className="text-xl font-semibold text-red-600">{breaches}</div>
            <div className="text-xs text-muted-foreground">in {period}</div>
          </div>
        </div>

        {breaches > 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive font-medium">
              ⚠️ {breaches} SLO breach{breaches > 1 ? 'es' : ''} detected. Review incident logs.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
