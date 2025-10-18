import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Play, CheckCircle2, XCircle, Clock, MapPin, Loader2 } from "lucide-react";

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  details?: string;
  timestamp?: string;
}

export const BarAssignmentTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([
    { name: "Création de 5 utilisateurs test", status: "pending" },
    { name: "Création du groupe test", status: "pending" },
    { name: "Ajout de 5 participants", status: "pending" },
    { name: "Confirmation automatique", status: "pending" },
    { name: "Vérification bar assigné", status: "pending" },
    { name: "Vérification données complètes", status: "pending" },
  ]);
  const [testResult, setTestResult] = useState<any>(null);

  const runTest = async () => {
    setIsRunning(true);
    setTestResult(null);

    // Réinitialiser les steps
    setSteps([
      { name: "Création de 5 utilisateurs test", status: "pending" },
      { name: "Création du groupe test", status: "pending" },
      { name: "Ajout de 5 participants", status: "pending" },
      { name: "Confirmation automatique", status: "pending" },
      { name: "Vérification bar assigné", status: "pending" },
      { name: "Vérification données complètes", status: "pending" },
    ]);

    try {
      console.log('🧪 Appel de l\'Edge Function test-bar-assignment...');
      
      // Appeler l'Edge Function
      const { data, error } = await supabase.functions.invoke('test-bar-assignment', {
        body: {}
      });

      if (error) throw error;

      console.log('✅ Réponse reçue:', data);

      // Mettre à jour les steps avec les résultats
      if (data.steps && Array.isArray(data.steps)) {
        setSteps(data.steps.map((step: any) => ({
          name: step.name,
          status: step.status,
          duration: step.duration,
          details: step.details,
          timestamp: new Date().toISOString()
        })));
      }

      setTestResult({
        success: data.success,
        group: data.barInfo,
        totalDuration: data.totalDuration,
        message: data.message
      });

    } catch (error: any) {
      console.error("❌ Erreur test:", error);
      setTestResult({ success: false, error: error.message });
      
      // Marquer toutes les étapes en erreur
      setSteps(prev => prev.map(step => ({
        ...step,
        status: step.status === 'pending' ? 'error' : step.status,
        details: step.status === 'pending' ? error.message : step.details
      })));
    } finally {
      setIsRunning(false);
    }
  };

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const completedSteps = steps.filter(s => s.status === 'success' || s.status === 'error').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-700" />
            <CardTitle>Test d'Assignation Automatique de Bar</CardTitle>
          </div>
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Lancer le test
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progression</span>
              <span>{completedSteps} / {steps.length}</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                step.status === 'success' ? 'bg-green-50 border-green-200' :
                step.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="mt-0.5">{getStepIcon(step.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{step.name}</span>
                  {step.duration && (
                    <Badge variant="outline" className="text-xs">
                      {step.duration}ms
                    </Badge>
                  )}
                </div>
                {step.details && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.details}
                  </p>
                )}
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(step.timestamp).toLocaleTimeString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {testResult && (
          <Alert className={testResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
            <AlertDescription>
              {testResult.success ? (
                <div className="space-y-2">
                  <p className="font-semibold text-green-800">✅ Test réussi !</p>
                  <div className="text-sm space-y-1">
                    <p><strong>Bar:</strong> {testResult.group?.bar_name}</p>
                    <p><strong>Adresse:</strong> {testResult.group?.bar_address}</p>
                    <p><strong>Coordonnées:</strong> {testResult.group?.bar_latitude?.toFixed(4)}, {testResult.group?.bar_longitude?.toFixed(4)}</p>
                    <p><strong>Durée totale:</strong> {testResult.totalDuration}ms</p>
                  </div>
                </div>
              ) : (
                <p className="font-semibold text-red-800">
                  ❌ Test échoué: {testResult.error || testResult.message || "Erreur inconnue"}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
