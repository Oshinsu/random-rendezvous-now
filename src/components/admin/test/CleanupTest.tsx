import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, Trash2, Loader2, CheckCircle2 } from "lucide-react";

export const CleanupTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Create old groups that should be cleaned up
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago

      const { data: oldGroups, error: createError } = await supabase
        .from('groups')
        .insert([
          {
            location_name: "Old Test 1",
            latitude: 14.6037,
            longitude: -61.0731,
            city_name: "Fort-de-France",
            max_participants: 5,
            current_participants: 2,
            status: 'waiting',
            created_by_user_id: user.id,
            created_at: oldDate.toISOString()
          },
          {
            location_name: "Old Test 2",
            latitude: 14.6037,
            longitude: -61.0731,
            city_name: "Fort-de-France",
            max_participants: 5,
            current_participants: 1,
            status: 'waiting',
            created_by_user_id: user.id,
            created_at: oldDate.toISOString()
          }
        ])
        .select();

      if (createError) throw createError;

      // Wait a bit
      await new Promise(r => setTimeout(r, 1000));

      // Call cleanup function
      const { data: cleanupData, error: cleanupError } = await supabase.functions.invoke(
        'cleanup-groups'
      );

      if (cleanupError) throw cleanupError;

      console.log('Cleanup function response:', cleanupData);

      // Check if groups were deleted
      const { data: remainingGroups } = await supabase
        .from('groups')
        .select('*')
        .in('id', oldGroups?.map(g => g.id) || []);

      const cleanupDetails = cleanupData?.cleaned_groups || [];
      const groupsCleaned = (oldGroups?.length || 0) - (remainingGroups?.length || 0);
      
      setResults({
        success: true,
        groupsCreated: oldGroups?.length || 0,
        groupsCleaned: groupsCleaned,
        cleanupResponse: cleanupData,
        detailedResults: {
          expected_cleanup: oldGroups?.length || 0,
          actual_cleanup: groupsCleaned,
          cleanup_efficiency: groupsCleaned === (oldGroups?.length || 0) ? '100%' : `${Math.round((groupsCleaned / (oldGroups?.length || 1)) * 100)}%`,
          cleaned_group_ids: cleanupDetails
        }
      });

    } catch (error: any) {
      console.error("Cleanup test error:", error);
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-700" />
            <CardTitle>Test Cleanup Automatique</CardTitle>
          </div>
          <Button onClick={runTest} disabled={isRunning} size="sm">
            {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Lancer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {results && (
          <div className="space-y-4">
            {results.success ? (
              <>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Test réussi</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{results.groupsCreated}</div>
                    <div className="text-sm text-muted-foreground">Groupes créés</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{results.groupsCleaned}</div>
                    <div className="text-sm text-muted-foreground">Groupes nettoyés</div>
                  </div>
                </div>
                {results.detailedResults && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-semibold mb-2">Détails du cleanup:</p>
                    <div className="text-xs space-y-1">
                      <p>Efficacité: <span className="font-medium">{results.detailedResults.cleanup_efficiency}</span></p>
                      <p>Expected: {results.detailedResults.expected_cleanup} | Actual: {results.detailedResults.actual_cleanup}</p>
                      {results.detailedResults.cleaned_group_ids?.length > 0 && (
                        <p className="text-muted-foreground">IDs nettoyés: {results.detailedResults.cleaned_group_ids.slice(0, 3).join(', ')}{results.detailedResults.cleaned_group_ids.length > 3 && '...'}</p>
                      )}
                    </div>
                  </div>
                )}
                {results.cleanupResponse && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Réponse brute</summary>
                    <div className="mt-2 p-3 bg-muted rounded font-mono">
                      <pre>{JSON.stringify(results.cleanupResponse, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-800 font-semibold">Erreur: {results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
