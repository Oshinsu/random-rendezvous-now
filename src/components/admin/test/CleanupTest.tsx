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

      // Check if groups were deleted
      const { data: remainingGroups } = await supabase
        .from('groups')
        .select('*')
        .in('id', oldGroups?.map(g => g.id) || []);

      setResults({
        success: true,
        groupsCreated: oldGroups?.length || 0,
        groupsCleaned: (oldGroups?.length || 0) - (remainingGroups?.length || 0),
        cleanupResponse: cleanupData
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
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{results.groupsCreated}</div>
                    <div className="text-sm text-gray-600">Groupes créés</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">{results.groupsCleaned}</div>
                    <div className="text-sm text-gray-600">Groupes nettoyés</div>
                  </div>
                </div>
                {results.cleanupResponse && (
                  <div className="p-3 bg-gray-50 rounded text-xs font-mono">
                    <pre>{JSON.stringify(results.cleanupResponse, null, 2)}</pre>
                  </div>
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
