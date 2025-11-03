import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Layout, Clock } from 'lucide-react';
import { SectionEngagementChart } from './SectionEngagementChart';
import { InteractionHeatmap } from './InteractionHeatmap';
import { useCMSAnalytics } from '@/hooks/useCMSAnalytics';
import { useCMSSEOScores } from '@/hooks/useCMSSEOScores';

interface CMSPerformanceDashboardProps {
  stats: {
    total: number;
    sections: number;
    recentlyUpdated: number;
  };
}

export const CMSPerformanceDashboard = ({ stats }: CMSPerformanceDashboardProps) => {
  const { data: analytics, isLoading: analyticsLoading } = useCMSAnalytics();
  const { data: seoData, isLoading: seoLoading } = useCMSSEOScores();

  // Calculate metrics
  const engagementScore = analytics?.engagementScore || 0;
  const seoHealth = seoData?.averageScore || 0;
  const trend = analytics?.trend || 0;
  const lastModified = analytics?.lastModification 
    ? new Date(analytics.lastModification).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Jamais';

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getTrendText = (value: number) => {
    if (value > 0) return `+${value}%`;
    return `${value}%`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement Score
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{engagementScore}/100</div>
              {!analyticsLoading && (
                <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
                  {getTrendText(trend)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur {analytics?.totalModifications || 0} modifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              SEO Health
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{seoHealth}/100</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {seoData?.scoresBySection.length || 0} sections analysées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sections actives
            </CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sections}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total} contenus total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dernière modification
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{lastModified}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.recentlyUpdated} cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement par Section</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionEngagementChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité des 90 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <InteractionHeatmap />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
