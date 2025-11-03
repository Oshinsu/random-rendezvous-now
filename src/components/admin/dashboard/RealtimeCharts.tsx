import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface UserGrowthData {
  date: string;
  total_users: number;
  new_users: number;
}

interface GroupStatusData {
  name: string;
  value: number;
  fill?: string;
}

interface ApiUsageData {
  date: string;
  requests: number;
  cost: number;
  errors?: number;
}

interface RealtimeChartsProps {
  userGrowthData: UserGrowthData[];
  groupStatusData: GroupStatusData[];
  apiUsageData: ApiUsageData[];
}

export const RealtimeCharts = ({ userGrowthData, groupStatusData, apiUsageData }: RealtimeChartsProps) => {
  // Use semantic colors from design system
  const COLORS = [
    'hsl(var(--warning))',
    'hsl(var(--info))', 
    'hsl(var(--success))',
    'hsl(var(--muted))'
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="total_users" stroke="hsl(var(--primary))" name="Total Users" strokeWidth={2} />
              <Line type="monotone" dataKey="new_users" stroke="hsl(var(--success))" name="New Users" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Group Status Pie */}
      <Card>
        <CardHeader>
          <CardTitle>Group Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={groupStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {groupStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* API Usage Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>API Usage (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={apiUsageData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="requests" stroke="hsl(var(--info))" fill="hsl(var(--info))" fillOpacity={0.3} name="Requests" />
              <Area type="monotone" dataKey="cost" stroke="hsl(var(--error))" fill="hsl(var(--error))" fillOpacity={0.3} name="Cost ($)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
