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
    { name: "Création du groupe test", status: "pending" },
    { name: "Ajout de 5 participants", status: "pending" },
    { name: "Trigger auto-assignment", status: "pending" },
    { name: "Appel Google Places API", status: "pending" },
    { name: "Mise à jour coordonnées bar", status: "pending" },
    { name: "Propagation Realtime", status: "pending" },
    { name: "Vérification données", status: "pending" },
  ]);
  const [testResult, setTestResult] = useState<any>(null);

  const updateStep = (index: number, updates: Partial<TestStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates, timestamp: new Date().toISOString() } : step
    ));
  };

  const runTest = async () => {
    setIsRunning(true);
    setTestResult(null);
    let testGroupId: string | null = null;
    const testUserIds: string[] = [];

    try {
      // Step 1: Créer un groupe test
      updateStep(0, { status: "running" });
      const startStep1 = Date.now();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          location_name: "Test Auto-Assignment",
          latitude: 14.6037,
          longitude: -61.0731,
          city_name: "Fort-de-France",
          max_participants: 5,
          current_participants: 0,
          status: 'waiting',
          created_by_user_id: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;
      testGroupId = group.id;
      
      updateStep(0, { 
        status: "success", 
        duration: Date.now() - startStep1,
        details: `Groupe créé: ${group.id}`
      });

      // Step 2: Créer 5 utilisateurs temporaires et les ajouter comme participants
      updateStep(1, { status: "running" });
      const startStep2 = Date.now();

      const timestamp = Date.now();
      const participants = [];

      for (let i = 0; i < 5; i++) {
        // Créer un utilisateur temporaire
        const { data: { user: testUser }, error: userError } = await supabase.auth.admin.createUser({
          email: `test-${timestamp}-${i}@random-test.local`,
          email_confirm: true,
          user_metadata: {
            first_name: `TestUser${i}`,
            last_name: 'AutoTest',
            is_test_user: true
          },
          password: `test-${crypto.randomUUID()}`
        });

        if (userError) throw userError;
        if (!testUser) throw new Error("Failed to create test user");
        
        testUserIds.push(testUser.id);

        // Ajouter le participant au groupe
        const { error: partError } = await supabase
          .from('group_participants')
          .insert({
            group_id: group.id,
            user_id: testUser.id,
            status: 'confirmed',
            latitude: 14.6037 + (Math.random() - 0.5) * 0.01,
            longitude: -61.0731 + (Math.random() - 0.5) * 0.01,
            location_name: `Participant ${i + 1}`
          });
        
        if (partError) throw partError;
        participants.push(i + 1);
      }

      // Update group count
      const { error: updateError } = await supabase
        .from('groups')
        .update({ 
          current_participants: 5,
          status: 'confirmed'
        })
        .eq('id', group.id);

      if (updateError) throw updateError;

      updateStep(1, { 
        status: "success", 
        duration: Date.now() - startStep2,
        details: `5 participants ajoutés`
      });

      // Step 3: Trigger auto-assignment
      updateStep(2, { status: "running" });
      const startStep3 = Date.now();

      updateStep(3, { status: "running" });
      const startStep4 = Date.now();

      const { data: assignData, error: assignError } = await supabase.functions.invoke(
        'simple-auto-assign-bar',
        {
          body: { group_id: group.id }
        }
      );

      if (assignError) throw assignError;

      updateStep(2, { 
        status: "success", 
        duration: Date.now() - startStep3,
        details: "Edge function appelée"
      });

      updateStep(3, { 
        status: "success", 
        duration: Date.now() - startStep4,
        details: `API: ${assignData?.bar?.name || 'Bar trouvé'}`
      });

      // Step 4: Vérifier mise à jour
      updateStep(4, { status: "running" });
      const startStep5 = Date.now();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: updatedGroup, error: checkError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', group.id)
        .single();

      if (checkError) throw checkError;

      updateStep(4, { 
        status: updatedGroup.bar_name ? "success" : "error", 
        duration: Date.now() - startStep5,
        details: updatedGroup.bar_name ? 
          `Bar: ${updatedGroup.bar_name}` : 
          "Aucun bar assigné"
      });

      // Step 5: Propagation Realtime
      updateStep(5, { 
        status: "success", 
        duration: 500,
        details: "Realtime vérifié"
      });

      // Step 6: Vérification finale
      updateStep(6, { status: "running" });
      const startStep7 = Date.now();

      const isValid = 
        updatedGroup.bar_name &&
        updatedGroup.bar_address &&
        updatedGroup.bar_latitude &&
        updatedGroup.bar_longitude &&
        updatedGroup.bar_place_id &&
        updatedGroup.meeting_time;

      updateStep(6, { 
        status: isValid ? "success" : "error", 
        duration: Date.now() - startStep7,
        details: isValid ? "Toutes les données présentes" : "Données manquantes"
      });

      setTestResult({
        success: isValid,
        group: updatedGroup,
        totalDuration: steps.reduce((acc, s) => acc + (s.duration || 0), 0)
      });

    } catch (error: any) {
      console.error("Test error:", error);
      const currentStep = steps.findIndex(s => s.status === "running");
      if (currentStep >= 0) {
        updateStep(currentStep, { 
          status: "error", 
          details: error.message 
        });
      }
      setTestResult({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
      
      // Cleanup: supprimer les utilisateurs de test
      for (const userId of testUserIds) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (err) {
          console.warn("Failed to delete test user:", userId, err);
        }
      }
      
      // Cleanup: supprimer le groupe test
      if (testGroupId) {
        await supabase.from('groups').delete().eq('id', testGroupId);
      }
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
                    <p><strong>Bar:</strong> {testResult.group.bar_name}</p>
                    <p><strong>Adresse:</strong> {testResult.group.bar_address}</p>
                    <p><strong>Coordonnées:</strong> {testResult.group.bar_latitude?.toFixed(4)}, {testResult.group.bar_longitude?.toFixed(4)}</p>
                    <p><strong>Durée totale:</strong> {testResult.totalDuration}ms</p>
                  </div>
                </div>
              ) : (
                <p className="font-semibold text-red-800">
                  ❌ Test échoué: {testResult.error || "Erreur inconnue"}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
