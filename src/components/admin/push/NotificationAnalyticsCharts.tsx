import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationTypeConfig } from '@/hooks/useNotificationTypesConfig';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Smartphone, Clock } from 'lucide-react';

interface NotificationAnalyticsChartsProps {
  notification: NotificationTypeConfig;
}

// Mock data - à remplacer par de vraies requêtes Supabase
const mockPerformanceData = [
  { date: '25 Oct', sent: 120, opened: 48, clicked: 12 },
  { date: '26 Oct', sent: 95, opened: 42, clicked: 15 },
  { date: '27 Oct', sent: 150, opened: 68, clicked: 22 },
  { date: '28 Oct', sent: 180, opened: 85, clicked: 28 },
  { date: '29 Oct', sent: 110, opened: 52, clicked: 18 },
  { date: '30 Oct', sent: 200, opened: 95, clicked: 35 },
  { date: '31 Oct', sent: 175, opened: 82, clicked: 30 },
];

const mockDeviceData = [
  { name: 'iOS', value: 65, color: '#3b82f6' },
  { name: 'Android', value: 35, color: '#10b981' },
];

const mockHourlyData = [
  { hour: '0h', count: 2 },
  { hour: '6h', count: 8 },
  { hour: '9h', count: 35 },
  { hour: '12h', count: 58 },
  { hour: '15h', count: 42 },
  { hour: '18h', count: 95 },
  { hour: '21h', count: 68 },
  { hour: '23h', count: 15 },
];

export const NotificationAnalyticsCharts = ({ notification }: NotificationAnalyticsChartsProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance 30j
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Envoyées"
              />
              <Line 
                type="monotone" 
                dataKey="opened" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Ouvertes"
              />
              <Line 
                type="monotone" 
                dataKey="clicked" 
                stroke="#a78bfa" 
                strokeWidth={2}
                name="Cliquées"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs flex items-center gap-2">
              <Smartphone className="h-3 w-3" />
              Par Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={mockDeviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  label={(entry) => `${entry.value}%`}
                >
                  {mockDeviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {mockDeviceData.map((device) => (
                <div key={device.name} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: device.color }}
                  />
                  <span className="text-xs">{device.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Par Heure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={mockHourlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">47.5%</p>
              <p className="text-xs text-muted-foreground">Open Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">18.2%</p>
              <p className="text-xs text-muted-foreground">Click Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">8.5%</p>
              <p className="text-xs text-muted-foreground">Conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
