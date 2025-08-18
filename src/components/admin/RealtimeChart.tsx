import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityMetrics {
  hour: string;
  users_active: number;
  groups_created: number;
  messages_sent: number;
}

interface RealtimeChartProps {
  data: ActivityMetrics[];
}

export const RealtimeChart = ({ data }: RealtimeChartProps) => {

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="users_active" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Utilisateurs actifs"
            dot={{ fill: '#3b82f6', r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="groups_created" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Groupes créés"
            dot={{ fill: '#10b981', r: 3 }}
          />
          <Line 
            type="monotone" 
            dataKey="messages_sent" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            name="Messages envoyés"
            dot={{ fill: '#8b5cf6', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};