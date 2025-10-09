import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity, User, AlertCircle } from 'lucide-react';
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
  days_since_last_login: number | null;
  never_logged_in: boolean;
  last_login_at: string | null;
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

const getRiskVariant = (risk: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (risk) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
};

const getHealthScoreIcon = (score: number) => {
  if (score >= 70) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (score >= 50) return <Activity className="w-4 h-4 text-yellow-500" />;
  if (score >= 30) return <TrendingDown className="w-4 h-4 text-orange-500" />;
  return <AlertCircle className="w-4 h-4 text-red-500" />;
};

const getEngagementBadge = (health: UserHealth) => {
  if (health.never_logged_in) {
    if (health.days_since_signup > 30) {
      return { icon: '🧟', label: 'Zombie', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    }
    return { icon: '👻', label: 'Jamais connecté', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };
  }
  
  if (health.total_outings >= 3 && health.days_since_last_login !== null && health.days_since_last_login <= 3) {
    return { icon: '⚡', label: 'Super actif', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
  }
  
  if (health.total_outings === 0 && health.days_since_last_login !== null && health.days_since_last_login <= 7) {
    return { icon: '👀', label: 'Curieux', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
  }
  
  if (health.total_outings >= 2 && health.days_since_last_login !== null && health.days_since_last_login > 30) {
    return { icon: '😴', label: 'Endormi', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
  }
  
  if (health.total_outings > 0) {
    return { icon: '✅', label: 'Actif', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
  }
  
  return { icon: '🆕', label: 'Nouveau', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' };
};

const formatLastLogin = (lastLogin: string | null, neverLoggedIn: boolean) => {
  if (neverLoggedIn || !lastLogin) return 'Jamais';
  
  const date = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
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
      <div className="space-y-3 mt-6">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-32 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (healthScores.length === 0) {
    return (
      <Card className="p-12 text-center mt-6">
        <Activity className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
        <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
        <p className="text-sm text-muted-foreground mt-2">
          Ajustez vos filtres ou calculez les health scores
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-1 gap-4">
        {healthScores.map((health) => {
          const badge = getEngagementBadge(health);
          return (
            <Card key={health.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold">
                        {health.profile?.first_name} {health.profile?.last_name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{health.profile?.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getRiskVariant(health.churn_risk)} className="capitalize">
                        {health.churn_risk === 'low' && '✅ Faible'}
                        {health.churn_risk === 'medium' && '⚠️ Moyen'}
                        {health.churn_risk === 'high' && '🔴 Élevé'}
                        {health.churn_risk === 'critical' && '💀 Critique'}
                      </Badge>
                      <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Dernière connexion</p>
                    <p className="font-semibold">
                      {formatLastLogin(health.last_login_at, health.never_logged_in)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Inscription</p>
                    <p className="font-semibold">Il y a {health.days_since_signup}j</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Groupes / Sorties</p>
                    <p className="font-semibold">{health.total_groups} / {health.total_outings}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Dernière activité</p>
                    <p className="font-semibold">
                      {health.days_since_last_activity 
                        ? `Il y a ${health.days_since_last_activity}j`
                        : 'Aucune'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getHealthScoreIcon(health.health_score)}
                      <span className="text-sm font-medium">Health Score</span>
                    </div>
                    <span className="text-2xl font-bold">{health.health_score}</span>
                  </div>
                  <Progress value={health.health_score} className="h-2" />
                </div>
              </div>
            </Card>
          );
        })}
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