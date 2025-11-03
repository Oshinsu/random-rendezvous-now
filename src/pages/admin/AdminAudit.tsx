import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Shield, User, Database, Filter, Clock, Activity } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContentVersionTimeline } from "@/components/admin/cms/ContentVersionTimeline";

export const AdminAudit = () => {
  const { auditLogs, loading, error, fetchAuditLogs } = useAdminAudit();
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterTable, setFilterTable] = useState<string>('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const handleFilter = () => {
    fetchAuditLogs({
      actionType: filterAction && filterAction !== 'all' ? filterAction : undefined,
      tableName: filterTable && filterTable !== 'all' ? filterTable : undefined
    });
  };

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'update':
      case 'modify':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete':
      case 'remove':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
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

  const uniqueActions = [...new Set(auditLogs.map(log => log.action_type))].filter(action => action && action.trim() !== '');
  const uniqueTables = [...new Set(auditLogs.map(log => log.table_name))].filter(table => table && table.trim() !== '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Journal d'audit SOTA 2025</h1>
          <p className="text-red-600 mt-2">{auditLogs.length} entrées d'audit + Timeline</p>
        </div>
      </div>

      {/* ✅ SOTA 2025: Stats Cards Audit */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actions aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {auditLogs.filter(log => {
                const today = new Date();
                const logDate = new Date(log.created_at);
                return logDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700">Insertions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              {auditLogs.filter(log => log.action_type.toLowerCase() === 'insert').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700">Modifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              {auditLogs.filter(log => log.action_type.toLowerCase() === 'update').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700">Suppressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">
              {auditLogs.filter(log => log.action_type.toLowerCase() === 'delete').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ SOTA 2025: Timeline Visuelle */}
      <Card className="border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="text-purple-800 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline des Modifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ContentVersionTimeline
            versions={auditLogs.slice(0, 20).map((log, idx) => ({
              id: log.id,
              version: idx + 1,
              created_at: log.created_at,
              created_by: log.admin_profile?.first_name || log.admin_profile?.last_name
                ? `${log.admin_profile.first_name || ''} ${log.admin_profile.last_name || ''}`.trim()
                : log.admin_profile?.email || 'Admin',
              updated_at: log.created_at,
              updated_by: log.admin_profile?.first_name || log.admin_profile?.last_name
                ? `${log.admin_profile.first_name || ''} ${log.admin_profile.last_name || ''}`.trim()
                : log.admin_profile?.email || 'Admin',
              changes_summary: `${log.action_type} sur ${log.table_name}${log.record_id ? ` (${log.record_id.slice(0, 8)})` : ''}`,
              changes: log.metadata ? JSON.stringify(log.metadata) : `${log.action_type} operation`,
              is_published: log.action_type.toLowerCase() !== 'delete'
            }))}
            onRevert={(versionId) => {
              console.log('Audit log restore not implemented for version', versionId);
            }}
          />
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type d'action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types d'action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types d'action</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Table</label>
              <Select value={filterTable} onValueChange={setFilterTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les tables</SelectItem>
                  {uniqueTables.map(table => (
                    <SelectItem key={table} value={table}>{table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleFilter}>
              <Filter className="h-4 w-4 mr-1" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Journal d'audit */}
      <Card>
        <CardHeader>
          <CardTitle>Entrées d'audit</CardTitle>
          <CardDescription>
            Historique des actions administratives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <Collapsible key={log.id}>
                <div className="border rounded-lg p-4">
                  <CollapsibleTrigger 
                    className="w-full"
                    onClick={() => toggleExpanded(log.id)}
                  >
                    <div className="flex justify-between items-start text-left">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getActionColor(log.action_type)}>
                            {log.action_type}
                          </Badge>
                          <Badge variant="outline">
                            <Database className="h-3 w-3 mr-1" />
                            {log.table_name}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            Admin: {
                              log.admin_profile?.first_name || log.admin_profile?.last_name
                                ? `${log.admin_profile.first_name || ''} ${log.admin_profile.last_name || ''}`.trim()
                                : log.admin_profile?.email || log.admin_user_id.slice(0, 8)
                            }
                          </span>
                          {log.record_id && (
                            <>
                              <span>•</span>
                              <span>Enregistrement: {log.record_id.slice(0, 8)}...</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {log.old_values && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Valeurs précédentes:</h4>
                          <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.new_values && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Nouvelles valeurs:</h4>
                          <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.metadata && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Métadonnées:</h4>
                          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}

            {auditLogs.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune entrée d'audit trouvée</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};