import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

interface CostTrendsProps {
  historical: Array<{ date: string; cost: number }>;
  forecast?: Array<{ date: string; cost: number }>;
}

export const CostTrends = ({ historical, forecast }: CostTrendsProps) => {
  const allData = [...historical, ...(forecast || [])];
  const totalCost = historical.reduce((sum, d) => sum + d.cost, 0);
  const avgCost = totalCost / historical.length;
  
  const projectedMonthly = forecast 
    ? forecast.reduce((sum, d) => sum + d.cost, 0)
    : avgCost * 30;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Cost Trends & Forecast</h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">${projectedMonthly.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Projected Monthly</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={allData}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
          />
          <Area 
            type="monotone" 
            dataKey="cost" 
            stroke="hsl(var(--primary))" 
            fill="url(#costGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div>
          <div className="text-xs text-muted-foreground">Avg/Day</div>
          <div className="text-lg font-semibold">${avgCost.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total (Period)</div>
          <div className="text-lg font-semibold">${totalCost.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Trend
          </div>
          <div className="text-lg font-semibold text-green-600">
            {historical.length > 1 
              ? `${(((historical[historical.length - 1].cost / historical[0].cost) - 1) * 100).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>
      </div>
    </Card>
  );
};
