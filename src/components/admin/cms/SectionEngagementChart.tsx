import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { useCMSPageAnalytics } from '@/hooks/useCMSPageAnalytics';

export const SectionEngagementChart = () => {
  const { data: analytics } = useCMSPageAnalytics();
  
  // Map real data to chart format
  const engagementData = analytics?.engagementBySection.map(section => ({
    section: section.section,
    clicks: section.clicks,
    conversions: section.conversions,
    bounce: section.bounces,
  })) || [];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={engagementData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="section" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Clics" />
        <Bar dataKey="conversions" fill="#22c55e" name="Conversions" />
      </BarChart>
    </ResponsiveContainer>
  );
};
