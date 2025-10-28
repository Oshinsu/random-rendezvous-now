import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Users, Mail, Target } from 'lucide-react';

interface CampaignStatsWidgetProps {
  campaigns: any[];
}

export const CampaignStatsWidget = ({ campaigns }: CampaignStatsWidgetProps) => {
  // Calculate stats
  const todayStats = {
    sent: campaigns.filter(c => c.status === 'active' && 
      new Date(c.send_at || c.created_at).toDateString() === new Date().toDateString()
    ).reduce((acc, c) => acc + (c.stats?.total_sent || 0), 0),
    opened: campaigns.reduce((acc, c) => acc + (c.stats?.opened || 0), 0),
    clicked: campaigns.reduce((acc, c) => acc + (c.stats?.clicked || 0), 0),
  };

  const openRate = todayStats.sent > 0 
    ? Math.round((todayStats.opened / todayStats.sent) * 100) 
    : 0;

  // Next upcoming campaign
  const upcomingCampaigns = campaigns
    .filter(c => c.status === 'scheduled' && c.send_at)
    .sort((a, b) => new Date(a.send_at).getTime() - new Date(b.send_at).getTime());
  const nextCampaign = upcomingCampaigns[0];

  // Top campaigns by conversion
  const topCampaigns = campaigns
    .filter(c => c.stats && c.stats.total_sent > 0)
    .sort((a, b) => (b.stats.converted || 0) - (a.stats.converted || 0))
    .slice(0, 3);

  // Segment distribution
  const segmentDistribution = campaigns.reduce((acc: any, c) => {
    const segmentName = c.segment?.segment_name || 'Sans segment';
    acc[segmentName] = (acc[segmentName] || 0) + (c.stats?.total_sent || 0);
    return acc;
  }, {});

  const pieData = Object.entries(segmentDistribution).map(([name, value]) => ({
    name,
    value: value as number
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8b5cf6', '#10b981'];

  // Mock line data for open rates trend (last 30 days)
  const lineData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    rate: Math.random() * 20 + 25
  }));

  return (
    <div className="space-y-4">
      {/* Today's Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Stats du jour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Mail className="h-3 w-3" />
                Envoyés
              </div>
              <div className="text-2xl font-bold">{todayStats.sent}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                Taux ouverture
              </div>
              <div className="text-2xl font-bold">{openRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Campaign */}
      {nextCampaign && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Prochaine campagne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium text-sm line-clamp-1">
                {nextCampaign.campaign_name}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(nextCampaign.send_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <Badge variant="outline" className="text-xs">
                  {nextCampaign.segment?.segment_name}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Rate Trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Taux d'ouverture (30j)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={lineData}>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Segment Distribution */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Par segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Campaigns */}
      {topCampaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="flex items-center justify-between text-xs">
                  <span className="line-clamp-1 flex-1">
                    {index + 1}. {campaign.campaign_name}
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    {campaign.stats.converted || 0}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};