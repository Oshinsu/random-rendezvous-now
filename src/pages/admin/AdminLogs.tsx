import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminTable } from "@/components/admin/AdminTable";
import { ExportButton } from "@/components/admin/ExportButton";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { useStructuredLogs } from "@/hooks/useStructuredLogs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, Info, AlertTriangle, CheckCircle, Download, Filter, Database } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  source: string;
  message: string;
  metadata?: any;
}

const pageSize = 100;

export const AdminLogs = () => {
  const { logs, loading, error, fetchLogs, currentPage, totalPages, setCurrentPage } = useAdminLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
  
  // ✅ SOTA 2025: Structured Logs avec filtres JSON
  const [structuredFilters, setStructuredFilters] = useState<any>({});
  const { 
    logs: structuredLogs, 
    loading: structuredLoading, 
    totalCount, 
    logEvent, 
    getEventCounts, 
    getLevelCounts,
    refresh: refreshStructured 
  } = useStructuredLogs(structuredFilters);

  useEffect(() => {
    fetchLogs(1);
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
          <h1 className="text-3xl font-bold text-red-800">Logs système SOTA 2025</h1>
          <p className="text-red-600 mt-2">Structured Logging + OpenTelemetry + JSON Metadata</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredLogs}
            filename="system-logs"
            format="csv"
          />
          <Button onClick={() => { fetchLogs(1); refreshStructured(); }} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>
      </div>

      {/* ✅ SOTA 2025: Tabs pour Legacy vs Structured Logs */}
      <Tabs defaultValue="structured" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="structured">
            <Database className="h-4 w-4 mr-2" />
            📊 Structured Logs (SOTA)
          </TabsTrigger>
          <TabsTrigger value="legacy">
            📜 Legacy Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="structured" className="space-y-6">
          {/* Stats Structured */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-700">Total Structured</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                  {totalCount}
                </div>
              </CardContent>
            </Card>
            
            {Object.entries(getLevelCounts()).map(([level, count]) => {
              const colors = {
                error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', value: 'text-red-800' },
                warn: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', value: 'text-yellow-800' },
                info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', value: 'text-blue-800' },
                debug: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', value: 'text-purple-800' }
              };
              const colorConfig = colors[level as keyof typeof colors] || colors.info;
              
              return (
                <Card key={level} className={`${colorConfig.border} ${colorConfig.bg}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm ${colorConfig.text}`}>{level.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${colorConfig.value}`}>
                      {count}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filtres Structured */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres Avancés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Niveau</label>
                  <Select 
                    value={structuredFilters.level || 'all'}
                    onValueChange={(value) => setStructuredFilters({ ...structuredFilters, level: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Événement</label>
                  <Input
                    placeholder="Ex: group_created"
                    value={structuredFilters.event || ''}
                    onChange={(e) => setStructuredFilters({ ...structuredFilters, event: e.target.value || undefined })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags (séparés par virgule)</label>
                  <Input
                    placeholder="Ex: production,critical"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setStructuredFilters({ ...structuredFilters, tags: tags.length > 0 ? tags : undefined });
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Structured Logs */}
          <Card>
            <CardHeader className="bg-red-50">
              <CardTitle className="text-red-800">Logs Structurés JSON</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {structuredLoading ? (
                <LoadingSpinner size="lg" />
              ) : (
                <div className="space-y-2">
                  {structuredLogs.map((log) => (
                    <Card key={log.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              {getLevelBadge(log.level)}
                              <Badge variant="outline" className="font-mono text-xs">
                                {log.event}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            
                            {log.tags && log.tags.length > 0 && (
                              <div className="flex gap-1">
                                {log.tags.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                  Metadata JSON
                                </summary>
                                <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {structuredLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun log structuré trouvé
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6">

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

          {/* Legacy Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          {/* Filtres Legacy */}
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

          {/* Table Legacy */}
          <AdminTable
            data={filteredLogs}
            columns={columns}
            searchKey="message"
            searchPlaceholder="Rechercher dans les messages..."
            hideSearch={true}
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

          {/* Pagination Legacy */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <Button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    variant="outline"
                  >
                    ← Précédent
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong>
                    <span className="ml-2">({pageSize} logs par page)</span>
                  </div>
                  <Button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    variant="outline"
                  >
                    Suivant →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};