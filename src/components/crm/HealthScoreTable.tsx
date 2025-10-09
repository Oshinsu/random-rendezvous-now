import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UserHealth {
  id: string;
  user_id: string;
  health_score: number;
  churn_risk: 'low' | 'medium' | 'high' | 'critical';
  last_activity_at: string;
  total_groups: number;
  total_outings: number;
  days_since_signup: number;
  days_since_last_activity: number;
  avg_days_between_outings: number;
  calculated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface HealthScoreTableProps {
  healthScores: UserHealth[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getRiskVariant = (risk: string): "destructive" | "secondary" | "default" => {
  switch (risk) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'default';
  }
};

const getHealthScoreIcon = (score: number) => {
  if (score >= 70) return <TrendingUp className="h-5 w-5 text-green-500" />;
  if (score >= 40) return <Activity className="h-5 w-5 text-yellow-500" />;
  return <TrendingDown className="h-5 w-5 text-red-500" />;
};

export const HealthScoreTable = ({
  healthScores,
  currentPage,
  totalPages,
  onPageChange,
  loading
}: HealthScoreTableProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (healthScores.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Activity className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
        <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
        <p className="text-sm text-muted-foreground mt-2">
          Ajustez vos filtres ou calculez les health scores
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {healthScores.map(health => (
          <Card key={health.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-4">
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-base truncate">
                    {health.profile?.first_name} {health.profile?.last_name}
                  </p>
                  <Badge 
                    variant={getRiskVariant(health.churn_risk)}
                    className="shrink-0"
                  >
                    {health.churn_risk === 'critical' ? 'Critique' :
                     health.churn_risk === 'high' ? 'Élevé' :
                     health.churn_risk === 'medium' ? 'Moyen' : 'Faible'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{health.profile?.email}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{health.total_outings}</span> sorties
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{health.total_groups}</span> groupes
                  </span>
                  <span className="flex items-center gap-1">
                    Inactif <span className="font-medium">{health.days_since_last_activity || 0}j</span>
                  </span>
                  {health.avg_days_between_outings && (
                    <span className="flex items-center gap-1">
                      Fréquence <span className="font-medium">{Math.round(health.avg_days_between_outings)}j</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Health Score */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center min-w-[80px]">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getHealthScoreIcon(health.health_score)}
                    <p className="text-3xl font-bold">{health.health_score}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="w-32">
                  <Progress 
                    value={health.health_score} 
                    className="h-3"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
