import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CRMOverviewProps {
  totalUsers: number;
  activeUsers: number;
  avgHealthScore: number;
  criticalRisk: number;
  highRisk: number;
  conversionRate: number;
  loading: boolean;
}

export const CRMOverview = ({
  totalUsers,
  activeUsers,
  avgHealthScore,
  criticalRisk,
  highRisk,
  conversionRate,
  loading
}: CRMOverviewProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Users */}
      <Card className="p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="secondary" className="bg-green-500 text-white border-0">
            {activeUsers} actifs
          </Badge>
        </div>
        <div className="text-4xl font-bold mb-1">{totalUsers}</div>
        <p className="text-sm text-muted-foreground">Utilisateurs Total</p>
      </Card>

      {/* Health Score Moyen */}
      <Card className="p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-full bg-green-500/10">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <Badge 
            variant="secondary" 
            className={`${avgHealthScore >= 70 ? 'bg-green-500' : avgHealthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'} text-white border-0`}
          >
            {avgHealthScore}/100
          </Badge>
        </div>
        <div className="mb-3">
          <div className="text-2xl font-bold mb-2">Health Score Moyen</div>
          <Progress 
            value={avgHealthScore} 
            className="h-2"
          />
        </div>
      </Card>

      {/* Risque de Churn */}
      <Card className="p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-full bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <Badge variant="secondary" className="bg-red-500 text-white border-0">
            {criticalRisk}
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-1">Risque de Churn</div>
        <p className="text-sm text-muted-foreground">
          {criticalRisk} critiques, {highRisk} élevés
        </p>
      </Card>

      {/* Taux de Conversion */}
      <Card className="p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-full bg-purple-500/10">
            <Target className="h-6 w-6 text-purple-600" />
          </div>
          <Badge variant="secondary" className="bg-purple-500 text-white border-0">
            {conversionRate}%
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-1">Taux de Conversion</div>
        <p className="text-sm text-muted-foreground">Signup → Première sortie</p>
      </Card>
    </div>
  );
};
