import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, BarChart3, Euro, TrendingUp, TrendingDown, Download } from 'lucide-react';
import type { BarAnalytics } from '@/hooks/useBarOwner';

interface BarAnalyticsChartProps {
  data: BarAnalytics[];
}

type TimeRange = '3' | '6' | '12';
type MetricKey = 'customers' | 'groups' | 'revenue';

export function BarAnalyticsChart({ data }: BarAnalyticsChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6');
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(['customers']);

  const toggleMetric = (metric: MetricKey) => {
    setActiveMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const exportData = () => {
    const csv = [
      ['Mois', 'Clients', 'Groupes', 'CA (€)'],
      ...chartData.map(d => [d.month, d.customers, d.groups, d.revenue])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthsToShow = parseInt(timeRange);
  const chartData = data
    .slice(0, monthsToShow)
    .reverse()
    .map(item => ({
      month: new Date(item.report_month).toLocaleDateString('fr-FR', { 
        month: 'short',
        year: '2-digit'
      }),
      customers: item.total_customers,
      groups: item.total_groups,
      revenue: item.estimated_revenue_eur / 100,
    }));

  // Calculate insights
  const latestMonth = data[0];
  const previousMonth = data[1];
  const customerChange = previousMonth 
    ? ((latestMonth.total_customers - previousMonth.total_customers) / previousMonth.total_customers) * 100
    : 0;
  const avgCustomers = chartData.reduce((sum, d) => sum + d.customers, 0) / chartData.length;
  const bestMonth = chartData.reduce((max, d) => d.customers > max.customers ? d : max, chartData[0]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Métriques:</span>
          <Button
            variant={activeMetrics.includes('customers') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleMetric('customers')}
          >
            <Users className="h-4 w-4 mr-2" />
            Clients
          </Button>
          <Button
            variant={activeMetrics.includes('groups') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleMetric('groups')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Groupes
          </Button>
          <Button
            variant={activeMetrics.includes('revenue') ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleMetric('revenue')}
          >
            <Euro className="h-4 w-4 mr-2" />
            CA
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Période:</span>
          {(['3', '6', '12'] as TimeRange[]).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range} mois
            </Button>
          ))}
          <Separator orientation="vertical" className="h-8 mx-2" />
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Insights */}
      <div className="flex flex-wrap gap-4 p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          {customerChange > 0 ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm">
            <span className="font-semibold">{Math.abs(customerChange).toFixed(1)}%</span>
            <span className="text-muted-foreground ml-1">vs mois précédent</span>
          </span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Badge variant="outline">Moyenne</Badge>
          <span className="text-sm font-semibold">{Math.round(avgCustomers)} clients/mois</span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Badge variant="outline">Meilleur mois</Badge>
          <span className="text-sm font-semibold">{bestMonth.month} ({bestMonth.customers} clients)</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'revenue') {
                  return [`${value.toFixed(0)}€`, 'CA estimé'];
                }
                return [value, name === 'customers' ? 'Clients' : 'Groupes'];
              }}
              labelFormatter={(label) => `Mois: ${label}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              formatter={(value) => {
                const labels: Record<string, string> = {
                  customers: 'Clients',
                  groups: 'Groupes',
                  revenue: 'CA estimé (€)'
                };
                return labels[value] || value;
              }}
            />
            {activeMetrics.includes('customers') && (
              <Bar 
                dataKey="customers" 
                fill="hsl(var(--primary))" 
                name="customers"
                radius={[4, 4, 0, 0]}
              />
            )}
            {activeMetrics.includes('groups') && (
              <Bar 
                dataKey="groups" 
                fill="hsl(var(--secondary))" 
                name="groups"
                radius={[4, 4, 0, 0]}
              />
            )}
            {activeMetrics.includes('revenue') && (
              <Bar 
                dataKey="revenue" 
                fill="hsl(var(--accent))" 
                name="revenue"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
