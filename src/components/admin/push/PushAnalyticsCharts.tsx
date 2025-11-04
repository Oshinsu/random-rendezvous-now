import React from 'react';
import { usePushAnalyticsCharts } from '@/hooks/usePushAnalyticsCharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8'];

export const PushAnalyticsCharts = () => {
  const { data, isLoading } = usePushAnalyticsCharts('month');

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance by Type */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Performance par Type de Notification</CardTitle>
          <CardDescription>Taux d'ouverture, de clic et de conversion par type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.performanceByType || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="openRate" name="Open Rate" fill="hsl(var(--primary))" />
              <Bar dataKey="clickRate" name="Click Rate" fill="hsl(var(--secondary))" />
              <Bar dataKey="conversionRate" name="Conversion" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Timeline Envois & Engagement</CardTitle>
            <CardDescription>30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).getDate().toString()} />
                <YAxis />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')} />
                <Legend />
                <Line type="monotone" dataKey="sent" name="Envoyées" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="opened" name="Ouvertes" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>📱 Distribution Devices</CardTitle>
            <CardDescription>iOS vs Android vs Web</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.deviceTypes || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(data?.deviceTypes || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Chart - SOTA 2025 Optimized */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 Peak Hours - Meilleurs Horaires</CardTitle>
          <CardDescription>Ouvertures par heure et jour de la semaine</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data?.peakHoursByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis label={{ value: 'Opens', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload;
                  const hour = payload[0].dataKey?.toString().replace('h', '');
                  return (
                    <div className="bg-background border p-3 rounded-lg shadow-lg">
                      <p className="font-semibold text-sm">{data.day}</p>
                      <p className="text-xs text-muted-foreground">
                        {hour}h: <span className="font-medium text-foreground">{payload[0].value} opens</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => `${value.replace('h', '')}h`}
              />
              {/* Generate 24 bars with gradient colors */}
              {Array.from({ length: 24 }, (_, hour) => (
                <Bar 
                  key={hour}
                  dataKey={`h${hour}`} 
                  name={`h${hour}`}
                  fill={`hsl(${210 + (hour / 24) * 60}, 70%, ${50 + (hour / 24) * 20}%)`}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-4">
            💡 Insight: Les pics d'engagement sont visibles par hauteur et couleur (hover pour détails)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
