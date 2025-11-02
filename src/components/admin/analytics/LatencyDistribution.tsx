import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface LatencyDistributionProps {
  p50: number;
  p95: number;
  p99: number;
  target?: number;
}

export const LatencyDistribution = ({ p50, p95, p99, target = 500 }: LatencyDistributionProps) => {
  const getStatusColor = (value: number) => {
    if (value < target) return 'text-green-600';
    if (value < target * 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarWidth = (value: number) => {
    const max = Math.max(p50, p95, p99, target);
    return (value / max) * 100;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Latency Distribution (ms)</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">P50 (Median)</span>
            <span className={`text-sm font-medium ${getStatusColor(p50)}`}>{p50}ms</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${getBarWidth(p50)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">P95</span>
            <span className={`text-sm font-medium ${getStatusColor(p95)}`}>{p95}ms</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${getBarWidth(p95)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-muted-foreground">P99</span>
            <span className={`text-sm font-medium ${getStatusColor(p99)}`}>{p99}ms</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${getBarWidth(p99)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target SLA</span>
            <span className="font-medium">&lt; {target}ms</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
