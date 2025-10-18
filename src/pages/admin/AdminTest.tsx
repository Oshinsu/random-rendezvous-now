import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarAssignmentTest } from "@/components/admin/test/BarAssignmentTest";
import { GroupLifecycleTest } from "@/components/admin/test/GroupLifecycleTest";
import { RealtimeTest } from "@/components/admin/test/RealtimeTest";
import { CleanupTest } from "@/components/admin/test/CleanupTest";
import { ApiDiagnosticPanel } from "@/components/admin/ApiDiagnosticPanel";
import { TestTube } from "lucide-react";

export const AdminTest = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-red-700" />
        <div>
          <h1 className="text-3xl font-bold text-red-800">Tests & Diagnostics Système</h1>
          <p className="text-red-600 mt-2">
            Suite complète de tests pour toutes les fonctions critiques de Random
          </p>
        </div>
      </div>

      <Tabs defaultValue="bar-assignment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="bar-assignment">Assignation Bar</TabsTrigger>
          <TabsTrigger value="lifecycle">Cycle de Vie</TabsTrigger>
          <TabsTrigger value="realtime">Realtime</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
          <TabsTrigger value="api">Diagnostic API</TabsTrigger>
        </TabsList>

        <TabsContent value="bar-assignment" className="space-y-4">
          <BarAssignmentTest />
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-4">
          <GroupLifecycleTest />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <RealtimeTest />
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-4">
          <CleanupTest />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <ApiDiagnosticPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
