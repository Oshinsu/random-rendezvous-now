import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'unusual_pattern';
  metric: string;
  severity: 'low' | 'medium' | 'high';
  detected_at: string;
  description: string;
  value: number;
  expected: number;
}

interface AnomalyDetectorProps {
  alerts: Anomaly[];
}

export const AnomalyDetector = ({ alerts }: AnomalyDetectorProps) => {
  const getIcon = (type: Anomaly['type']) => {
    switch (type) {
      case 'spike': return <TrendingUp className="h-4 w-4" />;
      case 'drop': return <TrendingUp className="h-4 w-4 rotate-180" />;
      case 'unusual_pattern': return <Zap className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: Anomaly['severity']) => {
    switch (severity) {
      case 'low': return 'secondary';
      case 'medium': return 'default';
      case 'high': return 'destructive';
    }
  };

  const highPriorityCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Anomaly Detection</h3>
        </div>
        {highPriorityCount > 0 && (
          <Badge variant="destructive">
            {highPriorityCount} Critical
          </Badge>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No anomalies detected</p>
          <p className="text-xs">All systems operating normally</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${
                  alert.severity === 'high' ? 'text-red-600' : 
                  alert.severity === 'medium' ? 'text-yellow-600' : 
                  'text-blue-600'
                }`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{alert.metric}</span>
                    <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true })}
                    </span>
                    <span className="font-mono">
                      {alert.value} vs {alert.expected} expected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
