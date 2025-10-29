import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Play, CheckCircle, XCircle, Loader2, Database, Cloud } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  message: string;
  test_group_id?: string;
  trigger_messages_created?: number;
  steps?: {
    group_created: boolean;
    participants_added: boolean;
    status_updated: boolean;
    trigger_message_created: boolean;
    bar_assigned: boolean;
  };
  bar_info?: {
    name: string;
    address: string;
    place_id: string;
  };
  test_duration_ms?: number;
  error?: string;
}

export const TriggerTestPanel = () => {
  const [sqlTesting, setSqlTesting] = useState(false);
  const [edgeTesting, setEdgeTesting] = useState(false);
  const [sqlResult, setSqlResult] = useState<TestResult | null>(null);
  const [edgeResult, setEdgeResult] = useState<TestResult | null>(null);

  const runSqlTest = async () => {
    setSqlTesting(true);
    setSqlResult(null);
    
    try {
      console.log('🧪 Démarrage test SQL...');
      
      const { data, error } = await supabase.rpc('test_trigger_auto_bar_assignment');
      
      if (error) {
        console.error('Erreur test SQL:', error);
        throw error;
      }

      console.log('✅ Résultat test SQL:', data);
      const result = data as unknown as TestResult;
      setSqlResult(result);
      
      if (result.success) {
        toast.success('Test SQL réussi', {
          description: result.message
        });
      } else {
        toast.error('Test SQL échoué', {
          description: result.message
        });
      }
    } catch (error) {
      console.error('Erreur test SQL:', error);
      setSqlResult({
        success: false,
        status: 'ERROR',
        message: '❌ Erreur lors du test SQL',
        error: error.message
      });
      toast.error('Erreur test SQL', {
        description: error.message
      });
    } finally {
      setSqlTesting(false);
    }
  };

  const runEdgeFunctionTest = async () => {
    setEdgeTesting(true);
    setEdgeResult(null);
    
    try {
      console.log('🧪 Invoking test-auto-bar-assignment edge function...');
      
      const { data, error } = await supabase.functions.invoke('test-auto-bar-assignment');
      
      if (error) {
        console.error('Erreur test Edge Function:', error);
        throw error;
      }

      console.log('✅ Résultat test Edge Function:', data);
      const result = data as unknown as TestResult;
      setEdgeResult(result);
      
      if (result.success) {
        toast.success('Test complet réussi', {
          description: result.message,
          duration: 5000
        });
      } else {
        toast.error('Test complet échoué', {
          description: result.message
        });
      }
    } catch (error) {
      console.error('Erreur test Edge Function:', error);
      setEdgeResult({
        success: false,
        status: 'ERROR',
        message: '❌ Erreur lors du test Edge Function',
        error: error.message
      });
      toast.error('Erreur test Edge Function', {
        description: error.message
      });
    } finally {
      setEdgeTesting(false);
    }
  };

  const renderTestResult = (result: TestResult | null, type: 'SQL' | 'Edge') => {
    if (!result) return null;

    const isSuccess = result.status === 'PASSED';
    const StatusIcon = isSuccess ? CheckCircle : XCircle;
    const statusColor = isSuccess ? 'text-green-600' : 'text-red-600';

    return (
      <Alert className={isSuccess ? 'border-green-500' : 'border-red-500'}>
        <StatusIcon className={`h-4 w-4 ${statusColor}`} />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">{result.message}</p>
            
            {result.steps && (
              <div className="text-sm space-y-1">
                {Object.entries(result.steps).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}

            {result.bar_info && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <p className="font-medium">Bar assigné:</p>
                <p>{result.bar_info.name}</p>
                <p className="text-muted-foreground">{result.bar_info.address}</p>
              </div>
            )}

            {result.test_duration_ms && (
              <p className="text-xs text-muted-foreground">
                Durée: {result.test_duration_ms}ms
              </p>
            )}

            {result.error && (
              <p className="text-xs text-red-600 mt-2">{result.error}</p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Test Trigger PostgreSQL (SQL)
          </CardTitle>
          <CardDescription>
            Test isolé du trigger PostgreSQL avec rollback automatique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runSqlTest}
            disabled={sqlTesting}
            className="w-full"
          >
            {sqlTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Lancer test SQL
              </>
            )}
          </Button>

          {renderTestResult(sqlResult, 'SQL')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Test Système Complet (Edge Function)
          </CardTitle>
          <CardDescription>
            Test end-to-end: création groupe, trigger, et assignment de bar réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runEdgeFunctionTest}
            disabled={edgeTesting}
            variant="default"
            className="w-full"
          >
            {edgeTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours (peut prendre 10s)...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Lancer test complet
              </>
            )}
          </Button>

          {renderTestResult(edgeResult, 'Edge')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guide des Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline">SQL</Badge>
            <p>Vérifie uniquement que le trigger PostgreSQL se déclenche correctement</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">Edge</Badge>
            <p>Test complet du système : création groupe → trigger → Edge Function → assignment bar réel</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
