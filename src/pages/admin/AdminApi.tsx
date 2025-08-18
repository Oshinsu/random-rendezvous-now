import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/components/admin/AdminTable";
import { ExportButton } from "@/components/admin/ExportButton";
import { useApiAnalytics } from "@/hooks/useApiAnalytics";
import type { ApiRequest } from "@/hooks/useApiAnalytics";
import { 
  Globe, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  MapPin,
  RefreshCw
} from "lucide-react";

export const AdminApi = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { analytics, loading, error, refetch } = useApiAnalytics(selectedPeriod);

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Success</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Client Error</Badge>;
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">Server Error</Badge>;
    } else {
      return <Badge variant="outline">Other</Badge>;
    }
  };

  const columns = [
    {
      header: "Heure",
      accessor: "created_at" as keyof ApiRequest,
      render: (value: string) => new Date(value).toLocaleString('fr-FR')
    },
    {
      header: "API",
      accessor: "api_name" as keyof ApiRequest,
      render: (value: string) => (
        <Badge variant="outline" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      header: "Endpoint",
      accessor: "endpoint" as keyof ApiRequest,
      render: (value: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {value}
        </code>
      )
    },
    {
      header: "Type",
      accessor: "request_type" as keyof ApiRequest,
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      )
    },
    {
      header: "Status",
      accessor: "status_code" as keyof ApiRequest,
      render: (value: number) => getStatusBadge(value)
    },
    {
      header: "Temps (ms)",
      accessor: "response_time_ms" as keyof ApiRequest,
      render: (value: number) => (
        <span className={value > 1000 ? 'text-red-600' : value > 500 ? 'text-yellow-600' : 'text-green-600'}>
          {value}ms
        </span>
      )
    },
    {
      header: "Coût",
      accessor: "cost_usd" as keyof ApiRequest,
      render: (value: number) => (
        <span className="text-green-700 font-mono">
          ${value?.toFixed(4)}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800">Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Analytics API</h1>
          <p className="text-red-600 mt-2">Monitoring des API externes et coûts d'utilisation</p>
        </div>
        <div className="flex items-center gap-4">
          <ExportButton
            data={analytics?.requests || []}
            filename="api-analytics"
            format="csv"
          />
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'day' ? 'Jour' : period === 'week' ? 'Semaine' : 'Mois'}
          </Button>
        ))}
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requêtes</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.stats.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.stats.requestsGrowth || 0}% depuis hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.stats.totalCost?.toFixed(4) || '0.0000'}
            </div>
            <p className="text-xs text-muted-foreground">
              Google Places API
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.stats.averageResponseTime || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Temps de réponse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics?.stats.errorCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Taux d'erreur: {analytics?.stats.errorRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API requests table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Requêtes API Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTable
            data={analytics?.requests || []}
            columns={columns}
            searchKey="endpoint"
            searchPlaceholder="Rechercher par endpoint..."
          />
        </CardContent>
      </Card>

      {/* Cost breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Coûts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Places Search</span>
              <span className="font-mono">
                ${(analytics?.stats.costBreakdown?.search || 0).toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Place Details</span>
              <span className="font-mono">
                ${(analytics?.stats.costBreakdown?.details || 0).toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Photos</span>
              <span className="font-mono">
                ${(analytics?.stats.costBreakdown?.photos || 0).toFixed(4)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center font-bold">
              <span>Total</span>
              <span className="font-mono">
                ${analytics?.stats.totalCost?.toFixed(4) || '0.0000'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quotas & Limites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Requêtes aujourd'hui</span>
                <span>{analytics?.stats.dailyRequests || 0} / 1000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((analytics?.stats.dailyRequests || 0) / 1000 * 100, 100)}%` 
                  }}
                />
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Optimisation recommandée</p>
                  <p>
                    Considérer un cache local pour réduire les appels API répétitifs.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};