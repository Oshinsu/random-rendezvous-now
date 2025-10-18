import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiDiagnosticPanel } from "@/components/admin/ApiDiagnosticPanel";
import { TriggerTestPanel } from "@/components/admin/TriggerTestPanel";
import { TestTube, Zap } from "lucide-react";

export const AdminTest = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TestTube className="h-8 w-8 text-red-700" />
        <div>
          <h1 className="text-3xl font-bold text-red-800">Tests & Diagnostics</h1>
          <p className="text-red-600 mt-2">
            Outils de test pour l'assignation automatique de bars et diagnostics API
          </p>
        </div>
      </div>

      {/* Auto Bar Assignment Testing */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Zap className="h-5 w-5" />
            Test d'Assignation Automatique de Bar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <TriggerTestPanel />
        </CardContent>
      </Card>

      {/* API Diagnostics */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <TestTube className="h-5 w-5" />
            Diagnostic API Google Places
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ApiDiagnosticPanel />
        </CardContent>
      </Card>
    </div>
  );
};
