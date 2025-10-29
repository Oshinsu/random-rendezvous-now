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

      {/* Peak Hours Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 Peak Hours Heatmap</CardTitle>
          <CardDescription>Meilleurs horaires d'ouverture (heures × jours de la semaine)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-25 gap-1 min-w-[800px]">
              <div className="col-span-1" />
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="text-xs text-center text-muted-foreground">
                  {i}h
                </div>
              ))}
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, dayIndex) => (
                <>
                  <div key={day} className="text-xs text-right pr-2 text-muted-foreground flex items-center">
                    {day}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const dataPoint = data?.peakHours.find((p) => p.day === day && p.hour === hour);
                    const value = dataPoint?.value || 0;
                    const intensity = Math.min(value / 50, 1);
                    
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="aspect-square rounded"
                        style={{
                          backgroundColor: `hsla(var(--primary), ${intensity})`,
                        }}
                        title={`${day} ${hour}h: ${value} opens`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            💡 Les horaires optimaux : Jeudi-Samedi 18h-22h (zone rouge/orange)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
