import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineData {
  time_bucket: string;
  groups_created: number;
  groups_confirmed: number;
  groups_completed: number;
  avg_participants: number;
  avg_hours_to_confirm: number;
}

interface GroupsTimelineChartProps {
  data: TimelineData[];
}

export const GroupsTimelineChart = ({ data }: GroupsTimelineChartProps) => {
  const chartData = data.map(d => ({
    time: format(new Date(d.time_bucket), 'dd/MM HH:mm', { locale: fr }),
    fullTime: d.time_bucket,
    'Créés': d.groups_created,
    'Confirmés': d.groups_confirmed,
    'Complétés': d.groups_completed,
    'Écart': d.groups_created - d.groups_completed,
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Timeline Création & Conversion</h3>
          <p className="text-sm text-muted-foreground">7 derniers jours - Agrégation horaire</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Créés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Confirmés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Complétés</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="time" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--foreground))' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="Créés"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary) / 0.2)"
            animationDuration={500}
          />
          <Area
            type="monotone"
            dataKey="Confirmés"
            stroke="hsl(142 76% 36%)"
            fill="hsl(142 76% 36% / 0.2)"
            animationDuration={500}
          />
          <Area
            type="monotone"
            dataKey="Complétés"
            stroke="hsl(221 83% 53%)"
            fill="hsl(221 83% 53% / 0.2)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
