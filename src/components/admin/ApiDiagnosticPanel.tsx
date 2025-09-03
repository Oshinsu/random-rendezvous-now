import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiagnosticResult {
  success: boolean;
  message: string;
  error?: string;
  details?: string;
  testData?: any;
  apiLoggerResult?: any;
}

export const ApiDiagnosticPanel = () => {
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setTesting(true);
    try {
      console.log('🧪 Starting API diagnostic...');
      
      const { data, error } = await supabase.functions.invoke('test-api-logger');
      
      if (error) {
        throw error;
      }

      setLastResult(data);
      
      if (data.success) {
        toast.success('Test API logger réussi!');
      } else {
        toast.error('Test API logger échoué');
      }
      
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setLastResult({
        success: false,
        message: 'Diagnostic failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Diagnostic échoué');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Diagnostic API Analytics
        </CardTitle>
        <CardDescription>
          Tester le système de logging des API pour diagnostiquer les problèmes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runDiagnostic}
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test en cours...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Lancer le diagnostic
            </>
          )}
        </Button>

        {lastResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={lastResult.success ? "default" : "destructive"}>
                {lastResult.success ? 'SUCCÈS' : 'ÉCHEC'}
              </Badge>
            </div>

            <div className="text-sm">
              <p className="font-medium">{lastResult.message}</p>
              {lastResult.error && (
                <p className="text-red-600 mt-1">Erreur: {lastResult.error}</p>
              )}
              {lastResult.details && (
                <p className="text-gray-600 mt-1">{lastResult.details}</p>
              )}
            </div>

            {lastResult.testData && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">Données de test</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify(lastResult.testData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Ce diagnostic vérifie si l'api-logger fonctionne correctement en envoyant une requête de test.</p>
        </div>
      </CardContent>
    </Card>
  );
};