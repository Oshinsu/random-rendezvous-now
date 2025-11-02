import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KPICardData {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

interface KPICardsProps {
  kpis: KPICardData[];
}

export const KPICards = ({ kpis }: KPICardsProps) => {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-error" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {kpis.map((kpi) => (
        <Card key={kpi.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
            {kpi.icon}
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.change !== undefined && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(kpi.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
