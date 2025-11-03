import { Target, TrendingUp, Layout, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionEngagementChart } from './SectionEngagementChart';
import { InteractionHeatmap } from './InteractionHeatmap';

interface CMSPerformanceDashboardProps {
  stats: {
    total: number;
    sections: number;
    recentlyUpdated: number;
  };
}

export const CMSPerformanceDashboard = ({ stats }: CMSPerformanceDashboardProps) => {
  // Calcul du score global d'engagement (simulation)
  const engagementScore = 85;
  const seoHealth = 72;

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300">Engagement Score</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{engagementScore}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12% cette semaine</p>
              </div>
              <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">SEO Health</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{seoHealth}</p>
                <Badge variant="outline" className="text-xs mt-1 bg-orange-100 dark:bg-orange-900">
                  3 optimisations
                </Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Sections actives</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.sections}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{stats.total} contenus</p>
              </div>
              <Layout className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Dernière modif</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">Il y a 2h</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stats.recentlyUpdated} cette semaine</p>
              </div>
              <Clock className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              📊 Engagement par Section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SectionEngagementChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🗓️ Activité des Modifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InteractionHeatmap />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
