import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTable } from "@/components/admin/AdminTable";
import { ExportButton } from "@/components/admin/ExportButton";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { Search, AlertCircle, Info, AlertTriangle, CheckCircle, Download } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  source: string;
  message: string;
  metadata?: any;
}

export const AdminLogs = () => {
  const { logs, loading, error, fetchLogs } = useAdminLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLevelBadge = (level: string) => {
    const variants = {
      error: { variant: 'destructive' as const, icon: AlertCircle, color: 'bg-red-100 text-red-800' },
      warn: { variant: 'outline' as const, icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      info: { variant: 'outline' as const, icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-300' },
      debug: { variant: 'outline' as const, icon: CheckCircle, color: 'bg-gray-100 text-gray-800 border-gray-300' }
    };
    
    const config = variants[level as keyof typeof variants] || variants.info;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  const filteredLogs = logs
    .filter(log => levelFilter === 'all' || log.level === levelFilter)
    .filter(log => 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const columns = [
    {
      header: "Heure",
      accessor: "timestamp" as keyof LogEntry,
      render: (value: string) => new Date(value).toLocaleString('fr-FR')
    },
    {
      header: "Niveau",
      accessor: "level" as keyof LogEntry,
      render: (value: string) => getLevelBadge(value)
    },
    {
      header: "Source",
      accessor: "source" as keyof LogEntry,
      render: (value: string) => (
        <Badge variant="outline" className="font-mono text-xs">
          {value}
        </Badge>
      )
    },
    {
      header: "Message",
      accessor: "message" as keyof LogEntry,
      render: (value: string) => (
        <div className="max-w-[400px] truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      header: "Détails",
      accessor: "metadata" as keyof LogEntry,
      render: (value: any) => (
        value ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => {
              // Modal avec JSON formaté
              alert(JSON.stringify(value, null, 2));
            }}
          >
            Voir détails
          </Button>
        ) : null
      )
    }
  ];

  const logCounts = {
    total: logs.length,
    error: logs.filter(log => log.level === 'error').length,
    warn: logs.filter(log => log.level === 'warn').length,
    info: logs.filter(log => log.level === 'info').length,
    debug: logs.filter(log => log.level === 'debug').length
  };

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
            <p className="text-red-800">Erreur lors du chargement des logs: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Logs système</h1>
          <p className="text-red-600 mt-2">Journal des événements et erreurs système</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredLogs}
            filename="system-logs"
            format="csv"
          />
          <Button onClick={fetchLogs} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques des logs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-700">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">
              {logCounts.total}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700">Erreurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {logCounts.error}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-700">Avertissements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {logCounts.warn}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Infos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {logCounts.info}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700">Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {logCounts.debug}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher dans les logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'error', 'warn', 'info', 'debug'] as const).map((level) => (
            <Button
              key={level}
              variant={levelFilter === level ? "default" : "outline"}
              size="sm"
              onClick={() => setLevelFilter(level)}
            >
              {level === 'all' ? 'Tous' : 
               level === 'error' ? 'Erreurs' :
               level === 'warn' ? 'Avertissements' :
               level === 'info' ? 'Infos' : 
               'Debug'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table des logs */}
      <AdminTable
        data={filteredLogs}
        columns={columns}
        searchKey="message"
        searchPlaceholder="Rechercher dans les messages..."
        hideSearch={true} // Car on a déjà notre propre search
      />

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              Aucun log trouvé pour les critères sélectionnés
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};