import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, Users, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface LifecycleStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  details?: string;
}

export const GroupLifecycleTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<LifecycleStep[]>([
    { name: "Création 5 users test", status: "pending" },
    { name: "Création groupe", status: "pending" },
    { name: "Ajout participant 1", status: "pending" },
    { name: "Ajout participant 2", status: "pending" },
    { name: "Ajout participant 3", status: "pending" },
    { name: "Vérif status 'waiting'", status: "pending" },
    { name: "Ajout participant 4", status: "pending" },
    { name: "Ajout participant 5", status: "pending" },
    { name: "Vérif status 'confirmed'", status: "pending" },
    { name: "Trigger bar assignment", status: "pending" },
    { name: "Vérif completion", status: "pending" },
  ]);

  const updateStep = (index: number, updates: Partial<LifecycleStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const runTest = async () => {
    setIsRunning(true);
    let groupId: string | null = null;
    const testUsers: any[] = [];

    try {
      // Étape 0: Créer 5 users test DISTINCTS (évite violation UNIQUE constraint)
      updateStep(0, { status: "running" });
      const usersStart = Date.now();
      
      for (let i = 0; i < 5; i++) {
        const timestamp = Date.now();
        const { data, error } = await supabase.auth.signUp({
          email: `test-lifecycle-${timestamp}-${i}@random-test.local`,
          password: crypto.randomUUID(),
          options: {
            data: {
              first_name: `TestUser${i}`,
              last_name: 'Lifecycle',
              is_test_user: true
            }
          }
        });
        
        if (error || !data.user) throw error || new Error(`User ${i} creation failed`);
        testUsers.push(data.user);
      }
      
      updateStep(0, { 
        status: "success", 
        duration: Date.now() - usersStart,
        details: `5 users créés avec IDs distincts`
      });

      // Étape 1: Créer groupe
      updateStep(1, { status: "running" });
      const start0 = Date.now();
      
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          location_name: "Test Lifecycle",
          latitude: 14.6037,
          longitude: -61.0731,
          city_name: "Fort-de-France",
          max_participants: 5,
          current_participants: 0,
          status: 'waiting',
          created_by_user_id: testUsers[0].id
        })
        .select()
        .single();

      if (groupError) throw groupError;
      groupId = group.id;
      
      updateStep(1, { 
        status: "success", 
        duration: Date.now() - start0,
        details: `ID: ${group.id.substring(0, 8)}...`
      });

      // Étapes 2-5: Ajouter participants progressivement avec des USER IDS DIFFÉRENTS
      for (let i = 0; i < 4; i++) {
        updateStep(i + 2, { status: "running" });
        const startP = Date.now();

        const { error: partError } = await supabase
          .from('group_participants')
          .insert({
            group_id: group.id,
            user_id: testUsers[i].id, // ✅ User DISTINCT pour chaque participant
            status: 'confirmed',
            latitude: 14.6037,
            longitude: -61.0731,
          });

        if (partError) throw partError;

        await supabase
          .from('groups')
          .update({ current_participants: i + 1 })
          .eq('id', group.id);

        updateStep(i + 2, { 
          status: "success", 
          duration: Date.now() - startP,
          details: `${i + 1}/5 participants (User ${i + 1})`
        });
      }

      // Vérif status waiting
      updateStep(6, { status: "running" });
      const { data: checkWaiting } = await supabase
        .from('groups')
        .select('status')
        .eq('id', group.id)
        .single();

      updateStep(6, { 
        status: checkWaiting?.status === 'waiting' ? "success" : "error", 
        duration: 100,
        details: `Status: ${checkWaiting?.status}`
      });

      // Ajout 5ème participant (User 5 distinct)
      updateStep(7, { status: "running" });
      const startP5 = Date.now();

      await supabase
        .from('group_participants')
        .insert({
          group_id: group.id,
          user_id: testUsers[4].id, // ✅ User 5 DISTINCT
          status: 'confirmed',
          latitude: 14.6037,
          longitude: -61.0731,
        });

      await supabase
        .from('groups')
        .update({ 
          current_participants: 5,
          status: 'confirmed'
        })
        .eq('id', group.id);

      updateStep(7, { 
        status: "success", 
        duration: Date.now() - startP5,
        details: "5/5 participants - Groupe complet (User 5)"
      });

      // Vérif status confirmed
      updateStep(8, { status: "running" });
      const { data: checkConfirmed } = await supabase
        .from('groups')
        .select('status')
        .eq('id', group.id)
        .single();

      updateStep(8, { 
        status: checkConfirmed?.status === 'confirmed' ? "success" : "error", 
        duration: 100,
        details: `Status: ${checkConfirmed?.status}`
      });

      // Trigger assignment
      updateStep(9, { status: "running" });
      const startAssign = Date.now();
      
      try {
        const { error: functionError } = await supabase.functions.invoke('simple-auto-assign-bar', {
          body: { group_id: group.id }
        });
        
        if (functionError) {
          updateStep(9, { 
            status: "error", 
            duration: Date.now() - startAssign,
            details: `Erreur function: ${functionError.message}`
          });
          return;
        }

        updateStep(9, { 
          status: "success", 
          duration: Date.now() - startAssign,
          details: "Bar assignment déclenché"
        });
      } catch (err: any) {
        updateStep(9, { 
          status: "error", 
          duration: Date.now() - startAssign,
          details: `Exception: ${err.message}`
        });
        return;
      }

      // Vérif completion
      updateStep(10, { status: "running" });
      await new Promise(r => setTimeout(r, 3000));

      const { data: final } = await supabase
        .from('groups')
        .select('*')
        .eq('id', group.id)
        .single();

      const isComplete = final?.bar_name && final?.bar_latitude && final?.bar_longitude;

      updateStep(10, { 
        status: isComplete ? "success" : "error", 
        duration: 3000,
        details: isComplete ? `Bar: ${final.bar_name}` : "Pas de bar assigné"
      });

    } catch (error: any) {
      const runningIndex = steps.findIndex(s => s.status === 'running');
      if (runningIndex >= 0) {
        updateStep(runningIndex, { status: "error", details: error.message });
      }
    } finally {
      setIsRunning(false);
      
      // Cleanup: supprimer groupe ET users test
      if (groupId) {
        await supabase.from('group_participants').delete().eq('group_id', groupId);
        await supabase.from('groups').delete().eq('id', groupId);
      }
      
      // Supprimer tous les users test créés
      for (const testUser of testUsers) {
        try {
          await supabase.auth.admin.deleteUser(testUser.id);
        } catch (e) {
          console.warn('Impossible de supprimer user test:', testUser.id);
        }
      }
    }
  };

  const getIcon = (status: LifecycleStep['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-red-700" />
            <CardTitle>Test Cycle de Vie d'un Groupe</CardTitle>
          </div>
          <Button onClick={runTest} disabled={isRunning} size="sm">
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Lancer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-2 rounded border ${
                step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                step.status === 'success' ? 'bg-green-50 border-green-200' :
                step.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              {getIcon(step.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{step.name}</span>
                  {step.duration && (
                    <Badge variant="outline" className="text-xs">{step.duration}ms</Badge>
                  )}
                </div>
                {step.details && (
                  <p className="text-xs text-muted-foreground mt-1">{step.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
