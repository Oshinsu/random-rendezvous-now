import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const SectionEngagementChart = () => {
  // Données simulées d'engagement par section
  const engagementData = [
    { section: 'Hero', clicks: 1243, conversions: 89, bounce: 23 },
    { section: 'Benefits', clicks: 892, conversions: 156, bounce: 18 },
    { section: 'How It Works', clicks: 734, conversions: 98, bounce: 31 },
    { section: 'CTA', clicks: 2103, conversions: 423, bounce: 12 },
  ];

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
