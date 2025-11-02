import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle } from "lucide-react";

interface CostProjectionChartProps {
  historicalData: Array<{ date: string; cost: number }>;
  projectedData: Array<{ date: string; cost: number }>;
  budget?: number;
}

export const CostProjectionChart = ({ historicalData, projectedData, budget = 10 }: CostProjectionChartProps) => {
  const allData = [...historicalData, ...projectedData].map((item, index) => ({
    ...item,
    isProjection: index >= historicalData.length
  }));

  const projectedTotal = projectedData.reduce((sum, item) => sum + item.cost, 0);
  const exceedsBudget = projectedTotal > budget;

  return (
    <Card className={exceedsBudget ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projection de coûts 30 jours
          </CardTitle>
          {exceedsBudget && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Budget dépassé
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Coût projeté</span>
            <span className="text-2xl font-bold text-red-800">${projectedTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Budget mensuel</span>
            <span className="text-lg font-semibold">${budget.toFixed(2)}</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={allData}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <ReferenceLine 
              y={budget / 30} 
              stroke="#f59e0b" 
              strokeDasharray="5 5"
              label={{ value: 'Budget journalier', position: 'insideTopRight', fill: '#f59e0b' }}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#dc2626"
              strokeWidth={2}
              fill="url(#costGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
