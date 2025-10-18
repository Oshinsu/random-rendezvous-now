import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, Shield, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface AuthStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
}

export const AuthenticationTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AuthStep[]>([
    { name: "Session actuelle", status: "pending" },
    { name: "Profil utilisateur", status: "pending" },
    { name: "Vérif admin", status: "pending" },
    { name: "Vérif bar owner", status: "pending" },
  ]);

  const updateStep = (index: number, updates: Partial<AuthStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const runTest = async () => {
    setIsRunning(true);

    try {
      // Session
      updateStep(0, { status: "running" });
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        updateStep(0, { status: "error", details: "Pas de session" });
        return;
      }
      
      updateStep(0, { 
        status: "success", 
        details: `User: ${user.email?.substring(0, 20)}...`
      });

      // Profile
      updateStep(1, { status: "running" });
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        updateStep(1, { status: "error", details: profileError.message });
      } else {
        updateStep(1, { 
          status: "success", 
          details: `${profile.first_name} ${profile.last_name}`
        });
      }

      // Admin check
      updateStep(2, { status: "running" });
      const { data: isAdmin, error: adminError } = await supabase
        .rpc('is_admin_user');

      if (adminError) {
        updateStep(2, { status: "error", details: adminError.message });
      } else {
        updateStep(2, { 
          status: "success", 
          details: isAdmin ? "✅ Admin" : "❌ Pas admin"
        });
      }

      // Bar owner check
      updateStep(3, { status: "running" });
      const { data: isBarOwner, error: ownerError } = await supabase
        .rpc('is_bar_owner');

      if (ownerError) {
        updateStep(3, { status: "error", details: ownerError.message });
      } else {
        updateStep(3, { 
          status: "success", 
          details: isBarOwner ? "✅ Bar owner" : "❌ Pas bar owner"
        });
      }

    } catch (error: any) {
      console.error("Auth test error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getIcon = (status: AuthStep['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-700" />
            <CardTitle>Test Authentification & Rôles</CardTitle>
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
              className={`flex items-start gap-3 p-3 rounded border ${
                step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                step.status === 'success' ? 'bg-green-50 border-green-200' :
                step.status === 'error' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              {getIcon(step.status)}
              <div className="flex-1">
                <span className="text-sm font-medium">{step.name}</span>
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
