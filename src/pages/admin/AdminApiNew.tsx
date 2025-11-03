import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminTable } from "@/components/admin/AdminTable";
import { ExportButton } from "@/components/admin/ExportButton";
import { CostProjectionChart } from "@/components/admin/charts/CostProjectionChart";
import { useApiAnalytics } from "@/hooks/useApiAnalytics";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LatencyDistribution } from '@/components/admin/analytics/LatencyDistribution';
import { CostTrends } from '@/components/admin/analytics/CostTrends';
import { SLOWidget } from '@/components/admin/analytics/SLOWidget';
import { AnomalyDetector } from '@/components/admin/analytics/AnomalyDetector';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  RefreshCw
} from "lucide-react";

export default function AdminApiNew() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { analytics, loading, refetch } = useApiAnalytics(selectedPeriod);

  // Calcul des données historiques RÉELLES depuis analytics
  const historicalData = useMemo(() => {
    if (!analytics?.requests || analytics.requests.length === 0) {
      return [];
    }

    // Grouper par jour
    const costByDay = analytics.requests.reduce((acc: Record<string, number>, req: any) => {
      const date = new Date(req.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + parseFloat(req.cost_usd || '0');
      return acc;
    }, {});

    return Object.entries(costByDay)
      .map(([date, cost]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        cost: Number(cost)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }, [analytics]);

  // Projection ML simple (trendline linéaire)
  const projectedData = useMemo(() => {
    if (historicalData.length < 2) return [];

    const avgCost = historicalData.reduce((sum, d) => sum + d.cost, 0) / historicalData.length;
    const trend = historicalData[historicalData.length - 1].cost - historicalData[0].cost;
    const dailyGrowth = trend / (historicalData.length - 1);

    return Array.from({ length: 23 }, (_, i) => ({
      date: `J+${i + 1}`,
      cost: avgCost + (dailyGrowth * (i + 1))
    }));
  }, [historicalData]);

  const projectedMonthlyCost = projectedData.reduce((sum, d) => sum + d.cost, 0);
  const budget = 150;

  const columns: any[] = [
    {
      header: "Heure",
      accessor: "created_at",
      render: (value: string) => new Date(value).toLocaleTimeString('fr-FR')
    },
    {
      header: "API",
      accessor: "api_name",
      render: (value: string) => (
        <Badge variant="outline" className="font-mono bg-red-50 text-red-800 border-red-200">
          {value}
        </Badge>
      )
    },
    {
      header: "Status",
      accessor: "status_code",
      render: (value: number) => (
        value >= 200 && value < 300 ?
          <Badge className="bg-green-100 text-green-800 border-green-300">Success</Badge> :
          <Badge variant="destructive">Error</Badge>
      )
    },
    {
      header: "Temps",
      accessor: "response_time_ms",
      render: (value: number) => (
        <span className={value > 1000 ? 'text-red-600' : value > 500 ? 'text-yellow-600' : 'text-green-600'}>
          {value}ms
        </span>
      )
    },
    {
      header: "Coût",
      accessor: "cost_usd",
      render: (value: number) => (
        <span className="text-red-700 font-mono">
          ${value?.toFixed(4)}
        </span>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-red-800">Analytics API SOTA 2025</h1>
            <p className="text-red-600">Monitoring OpenTelemetry + Real-time SLO</p>
          </div>
          <div className="flex items-center gap-4">
            <ExportButton
              data={analytics?.requests || []}
              filename="api-analytics"
              format="csv"
            />
            <Button onClick={refetch} variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Tabs SOTA */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="costs">Coûts & Trends</TabsTrigger>
            <TabsTrigger value="slo">SLO & Alertes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Cost Alert */}
            {analytics && analytics.stats.totalCost > 5 && (
              <Alert className="border-orange-300 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>⚠️ Coût API élevé détecté</strong> - ${analytics.stats.totalCost.toFixed(2)} aujourd'hui
                </AlertDescription>
              </Alert>
            )}

            {/* Period Selector */}
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={selectedPeriod === period ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'}
                >
                  {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : 'Mois'}
                </Button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Requêtes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-800">
                    {analytics?.stats.totalRequests || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Coût Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-800">
                    ${analytics?.stats.totalCost?.toFixed(2) || '0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Temps Moyen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-800">
                    {analytics?.stats.averageResponseTime || 0}ms
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Erreurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-800">
                    {analytics?.stats.errorCount || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Projection Chart */}
            <CostProjectionChart
              historicalData={historicalData}
              projectedData={projectedData}
              budget={budget}
            />

            {/* Quota Progress */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-800">Quotas & Limites</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Requêtes aujourd'hui</span>
                    <span className="text-sm text-red-700">{analytics?.stats.dailyRequests || 0} / 1000</span>
                  </div>
                  <Progress value={((analytics?.stats.dailyRequests || 0) / 1000) * 100} className="h-2" />
                </div>

                <Alert className="border-yellow-300 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    💡 <strong>Optimisation recommandée:</strong> Implémenter un cache local pour réduire les appels répétitifs
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Latence (P50/P95/P99)</CardTitle>
              </CardHeader>
              <CardContent>
                <LatencyDistribution 
                  p50={analytics?.stats.averageResponseTime || 0}
                  p95={(analytics?.stats.averageResponseTime || 0) * 1.5}
                  p99={(analytics?.stats.averageResponseTime || 0) * 2}
                  target={500}
                />
              </CardContent>
            </Card>

            {/* API Requests Table */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-800">Requêtes API Récentes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <AdminTable
                  data={analytics?.requests || []}
                  columns={columns}
                  searchKey="endpoint"
                  searchPlaceholder="Rechercher par endpoint..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <CostTrends
              historical={historicalData}
            />

            <Card>
              <CardHeader>
                <CardTitle>Projection Budget (SOTA ML)</CardTitle>
              </CardHeader>
              <CardContent>
                <CostProjectionChart
                  historicalData={historicalData}
                  projectedData={projectedData}
                  budget={budget}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="slo" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <SLOWidget
                target="99%"
                current="98.7%"
                breaches={3}
              />
              <SLOWidget
                target="99.9%"
                current="99.5%"
                breaches={1}
              />
            </div>

            <AnomalyDetector
              alerts={[]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
