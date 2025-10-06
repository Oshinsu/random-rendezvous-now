import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CohortData {
  cohort: string;
  signups: number;
  activated: number;
  firstOuting: number;
  regular: number;
  avgLifetimeValue: number;
  retentionRate: number;
}

const MOCK_COHORTS: CohortData[] = [
  { cohort: 'Jan 2025', signups: 150, activated: 120, firstOuting: 85, regular: 42, avgLifetimeValue: 125, retentionRate: 28 },
  { cohort: 'Fév 2025', signups: 180, activated: 145, firstOuting: 98, regular: 51, avgLifetimeValue: 135, retentionRate: 28 },
  { cohort: 'Mar 2025', signups: 220, activated: 185, firstOuting: 132, regular: 68, avgLifetimeValue: 148, retentionRate: 31 },
  { cohort: 'Avr 2025', signups: 250, activated: 210, firstOuting: 158, regular: 89, avgLifetimeValue: 162, retentionRate: 36 },
  { cohort: 'Mai 2025', signups: 280, activated: 238, firstOuting: 189, regular: 105, avgLifetimeValue: 175, retentionRate: 38 },
];

export const CohortAnalysis = () => {
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
              {MOCK_COHORTS.map((cohort, index) => {
                const prevCohort = MOCK_COHORTS[index - 1];
                const retentionTrend = prevCohort
                  ? cohort.retentionRate - prevCohort.retentionRate
                  : 0;

                return (
                  <tr key={cohort.cohort} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{cohort.cohort}</td>
                    <td className="text-right p-2">{cohort.signups}</td>
                    <td className="text-right p-2">
                      {cohort.activated}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({((cohort.activated / cohort.signups) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="text-right p-2">
                      {cohort.firstOuting}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({((cohort.firstOuting / cohort.signups) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="text-right p-2">
                      {cohort.regular}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({((cohort.regular / cohort.signups) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="text-right p-2">
                      <Badge variant="secondary">
                        {cohort.avgLifetimeValue}€
                      </Badge>
                    </td>
                    <td className="text-right p-2">
                      <div className="flex items-center justify-end gap-1">
                        <span>{cohort.retentionRate}%</span>
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

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm text-muted-foreground">Meilleure cohorte</p>
            <p className="text-xl font-bold text-green-700">Mai 2025</p>
            <p className="text-sm text-green-600">38% de rétention</p>
          </Card>
          
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-muted-foreground">Trend global</p>
            <p className="text-xl font-bold text-blue-700">+10%</p>
            <p className="text-sm text-blue-600">Amélioration continue</p>
          </Card>
          
          <Card className="p-4 bg-purple-50 border-purple-200">
            <p className="text-sm text-muted-foreground">LTV moyen</p>
            <p className="text-xl font-bold text-purple-700">149€</p>
            <p className="text-sm text-purple-600">Toutes cohortes</p>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
