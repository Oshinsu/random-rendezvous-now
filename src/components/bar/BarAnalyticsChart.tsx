import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BarAnalytics } from '@/hooks/useBarOwner';

interface BarAnalyticsChartProps {
  data: BarAnalytics[];
}

export function BarAnalyticsChart({ data }: BarAnalyticsChartProps) {
  const chartData = data
    .slice(0, 6) // Last 6 months
    .reverse() // Oldest first
    .map(item => ({
      month: new Date(item.report_month).toLocaleDateString('fr-FR', { 
        month: 'short',
        year: '2-digit'
      }),
      customers: item.total_customers,
      groups: item.total_groups,
      revenue: item.estimated_revenue_eur / 100, // Convert cents to euros
    }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'revenue') {
                return [`${value.toFixed(0)}€`, 'CA estimé'];
              }
              return [value, name === 'customers' ? 'Clients' : 'Groupes'];
            }}
            labelFormatter={(label) => `Mois: ${label}`}
          />
          <Bar 
            dataKey="customers" 
            fill="hsl(var(--primary))" 
            name="customers"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}