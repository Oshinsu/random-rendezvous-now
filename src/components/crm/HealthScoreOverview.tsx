import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertCircle, 
  Info,
  Users,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Target,
  Zap,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { HealthScoreTable } from './HealthScoreTable';

interface HealthStats {
  avgHealthScore: number;
  totalUsers: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

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

interface HealthScoreOverviewProps {
  stats: HealthStats;
  healthScores: UserHealth[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  onCalculateHealth: () => void;
  calculating: boolean;
}

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e'
};

export const HealthScoreOverview = ({
  stats,
  healthScores,
  currentPage,
  totalPages,
  onPageChange,
  loading,
  onCalculateHealth,
  calculating
}: HealthScoreOverviewProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Préparer les données pour les charts
  const riskDistribution = [
    { name: 'Critique', value: stats.criticalRisk, color: COLORS.critical },
    { name: 'Élevé', value: stats.highRisk, color: COLORS.high },
    { name: 'Moyen', value: stats.mediumRisk, color: COLORS.medium },
    { name: 'Faible', value: stats.lowRisk, color: COLORS.low }
  ].filter(item => item.value > 0);

  // Distribution par tranche de score
  const scoreDistribution = React.useMemo(() => {
    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 }
    ];

    healthScores.forEach(user => {
      const range = ranges.find(r => user.health_score >= r.min && user.health_score <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [healthScores]);

  return (
    <div className="space-y-6">
      {/* Header avec KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgHealthScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur {stats.totalUsers} utilisateurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risque Critique</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.criticalRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.criticalRisk / stats.totalUsers) * 100).toFixed(1)}% des utilisateurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risque Élevé</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.highRisk / stats.totalUsers) * 100).toFixed(1)}% des utilisateurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonne Santé</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.lowRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.lowRisk / stats.totalUsers) * 100).toFixed(1)}% des utilisateurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Explication du calcul */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setShowExplanation(!showExplanation)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>Comment le Health Score est calculé ?</CardTitle>
            </div>
            {showExplanation ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
          <CardDescription>
            Algorithme basé sur 7 critères pour évaluer l'engagement utilisateur
          </CardDescription>
        </CardHeader>
        {showExplanation && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">1. Connexion & Engagement</h4>
                  <Badge variant="outline">±30 pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Connexion récente (≤3j): <strong>+20 pts</strong><br/>
                  • Inactivité ({'>'}30j): <strong>-30 pts</strong><br/>
                  • Jamais connecté + zombie ({'>'}30j): <strong>10 pts fixes</strong>
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">2. Qualité d'Engagement</h4>
                  <Badge variant="outline">±15 pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  • {'>'}70% connexions aux heures de pointe (18h-22h): <strong>+15 pts</strong><br/>
                  • 50-70%: <strong>+10 pts</strong><br/>
                  • {'<'}30%: <strong>-5 pts</strong>
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">3. Sorties Réalisées</h4>
                  <Badge variant="outline">+30 pts max</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Chaque sortie réussie: <strong>+5 pts</strong><br/>
                  • Plafonné à <strong>+30 pts</strong>
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">4. Taux de Conversion</h4>
                  <Badge variant="outline">±15 pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  • {'>'}50% groupes → sorties: <strong>+10 pts</strong><br/>
                  • {'>'}3 groupes créés mais 0 sortie: <strong>-15 pts</strong>
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">5. Inactivité Récente</h4>
                  <Badge variant="outline">-20 pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  • {'>'}30j sans activité: <strong>-20 pts</strong><br/>
                  • {'>'}14j sans activité: <strong>-10 pts</strong>
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">6. Régularité</h4>
                  <Badge variant="outline">+15 pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Moyenne {'<'}14j entre sorties: <strong>+15 pts</strong><br/>
                  • Indique un utilisateur régulier et engagé
                </p>
              </div>

              <div className="space-y-2 p-4 bg-muted/50 rounded-lg col-span-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">7. Période de Grâce Nouveaux</h4>
                  <Badge variant="outline">Floor 40 pts</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  • Utilisateur ≤7j d'ancienneté sans sortie: <strong>minimum 40 pts garanti</strong><br/>
                  • Permet aux nouveaux de découvrir l'app sans pénalité
                </p>
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm">
                <strong>Score final:</strong> Commence à 50 pts (base), puis ajustement selon les 7 critères. 
                Le score est <strong>borné entre 0 et 100</strong>.
              </p>
              <p className="text-sm mt-2">
                <strong>Churn Risk:</strong> 
                <span className="ml-2 text-green-600">≥70 = Faible</span>
                <span className="ml-2 text-yellow-600">≥50 = Moyen</span>
                <span className="ml-2 text-orange-600">≥30 = Élevé</span>
                <span className="ml-2 text-red-600">{'<'}30 = Critique</span>
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribution par Risque de Churn</CardTitle>
            <CardDescription>Répartition des utilisateurs par niveau de risque</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution par Tranche de Score</CardTitle>
            <CardDescription>Nombre d'utilisateurs par plage de health score</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
          className="gap-2"
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Masquer les détails utilisateurs
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Voir les détails utilisateurs ({stats.totalUsers})
            </>
          )}
        </Button>

        <Button
          onClick={onCalculateHealth}
          disabled={calculating}
          className="gap-2"
        >
          <Activity className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
          {calculating ? 'Calcul en cours...' : 'Recalculer les scores'}
        </Button>
      </div>

      {/* Détails utilisateurs */}
      {showDetails && (
        <HealthScoreTable
          healthScores={healthScores}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          loading={loading}
        />
      )}
    </div>
  );
};
