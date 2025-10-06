import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCRMAnalytics } from '@/hooks/useCRMAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export const CohortAnalysis = () => {
  const { analytics, loading } = useCRMAnalytics();

  if (loading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const cohortData = analytics?.cohorts || [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse de Cohortes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Cohorte</th>
                <th className="text-right p-2 font-medium">Signups</th>
                <th className="text-right p-2 font-medium">Activés</th>
                <th className="text-right p-2 font-medium">1ère Sortie</th>
                <th className="text-right p-2 font-medium">Réguliers</th>
                <th className="text-right p-2 font-medium">LTV Moy.</th>
                <th className="text-right p-2 font-medium">Rétention</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((cohort, index) => {
                const prevCohort = cohortData[index - 1];
                const retentionTrend = prevCohort
                  ? cohort.retention_rate - prevCohort.retention_rate
                  : 0;

                const activationRate = cohort.total_signups > 0 
                  ? ((cohort.activated_users / cohort.total_signups) * 100).toFixed(0) 
                  : 0;
                const firstOutingRate = cohort.total_signups > 0 
                  ? ((cohort.first_outing_users / cohort.total_signups) * 100).toFixed(0) 
                  : 0;
                const regularRate = cohort.total_signups > 0 
                  ? ((cohort.regular_users / cohort.total_signups) * 100).toFixed(0) 
                  : 0;

                return (
                  <tr key={cohort.cohort_month} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{cohort.cohort_month}</td>
                    <td className="text-right p-2">{cohort.total_signups}</td>
                    <td className="text-right p-2">
                      {cohort.activated_users}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({activationRate}%)
                      </span>
                    </td>
                    <td className="text-right p-2">
                      {cohort.first_outing_users}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({firstOutingRate}%)
                      </span>
                    </td>
                    <td className="text-right p-2">
                      {cohort.regular_users}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({regularRate}%)
                      </span>
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="secondary">
                        {cohort.avg_ltv}€
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <div className="flex items-center justify-end gap-1">
                        <span>{cohort.retention_rate}%</span>
                        {retentionTrend > 0 && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {retentionTrend < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {retentionTrend === 0 && <Minus className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {cohortData.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-sm text-muted-foreground">Meilleure cohorte</p>
              <p className="text-xl font-bold text-green-700">
                {[...cohortData].sort((a, b) => b.retention_rate - a.retention_rate)[0]?.cohort_month}
              </p>
              <p className="text-sm text-green-600">
                {[...cohortData].sort((a, b) => b.retention_rate - a.retention_rate)[0]?.retention_rate}% de rétention
              </p>
            </Card>
            
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-muted-foreground">Trend global</p>
              <p className="text-xl font-bold text-blue-700">
                {cohortData.length >= 2 
                  ? `${(cohortData[cohortData.length - 1].retention_rate - cohortData[0].retention_rate).toFixed(0)}%`
                  : 'N/A'
                }
              </p>
              <p className="text-sm text-blue-600">Évolution totale</p>
            </Card>
            
            <Card className="p-4 bg-purple-50 border-purple-200">
              <p className="text-sm text-muted-foreground">LTV moyen</p>
              <p className="text-xl font-bold text-purple-700">
                {Math.round(cohortData.reduce((sum, c) => sum + c.avg_ltv, 0) / cohortData.length)}€
              </p>
              <p className="text-sm text-purple-600">Toutes cohortes</p>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
