import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, MessageSquare, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ChatStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details?: string;
}

export const ChatSystemTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<ChatStep[]>([
    { name: "Création groupe test", status: "pending" },
    { name: "Envoi message utilisateur", status: "pending" },
    { name: "Envoi message système", status: "pending" },
    { name: "Lecture messages", status: "pending" },
    { name: "Ajout réaction", status: "pending" },
    { name: "Vérif persistance", status: "pending" },
  ]);

  const updateStep = (index: number, updates: Partial<ChatStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const runTest = async () => {
    setIsRunning(true);
    let groupId: string | null = null;
    let messageId: string | null = null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Créer groupe
      updateStep(0, { status: "running" });
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          location_name: "Test Chat",
          latitude: 14.6037,
          longitude: -61.0731,
          city_name: "Fort-de-France",
          max_participants: 5,
          current_participants: 1,
          status: 'waiting',
          created_by_user_id: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;
      groupId = group.id;

      // Ajouter participant
      await supabase
        .from('group_participants')
        .insert({
          group_id: group.id,
          user_id: user.id,
          status: 'confirmed',
          latitude: 14.6037,
          longitude: -61.0731,
        });

      updateStep(0, { status: "success", details: "Groupe créé" });

      // Message utilisateur
      updateStep(1, { status: "running" });
      const { data: userMsg, error: msgError } = await supabase
        .from('group_messages')
        .insert({
          group_id: group.id,
          user_id: user.id,
          message: "Test message utilisateur",
          is_system: false
        })
        .select()
        .single();

      if (msgError) throw msgError;
      messageId = userMsg.id;
      
      updateStep(1, { status: "success", details: "Message envoyé" });

      // Message système
      updateStep(2, { status: "running" });
      const { error: sysError } = await supabase
        .from('group_messages')
        .insert({
          group_id: group.id,
          user_id: user.id,
          message: "Test message système",
          is_system: true
        });

      if (sysError) throw sysError;
      updateStep(2, { status: "success", details: "Message système envoyé" });

      // Lecture messages
      updateStep(3, { status: "running" });
      const { data: messages, error: readError } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', group.id)
        .order('created_at', { ascending: false });

      if (readError) throw readError;
      updateStep(3, { 
        status: "success", 
        details: `${messages?.length || 0} messages lus`
      });

      // Ajout réactions multiples
      updateStep(4, { status: "running" });
      if (messageId) {
        const reactions = ['👍', '❤️', '🔥'];
        const reactionsObj: Record<string, string[]> = {};
        
        for (const emoji of reactions) {
          reactionsObj[emoji] = [user.id];
        }
        
        const { error: reactionError } = await supabase
          .from('group_messages')
          .update({ reactions: reactionsObj })
          .eq('id', messageId);

        if (reactionError) throw reactionError;
        updateStep(4, { status: "success", details: `${reactions.length} réactions ajoutées` });
      } else {
        updateStep(4, { status: "error", details: "Pas de message ID" });
      }

      // Vérif
      updateStep(5, { status: "running" });
      const { data: checkMsg } = await supabase
        .from('group_messages')
        .select('reactions')
        .eq('id', messageId || '')
        .single();

      const hasReaction = checkMsg?.reactions && Object.keys(checkMsg.reactions).length > 0;
      updateStep(5, { 
        status: hasReaction ? "success" : "error", 
        details: hasReaction ? "Réaction persistée" : "Pas de réaction"
      });

    } catch (error: any) {
      const runningIndex = steps.findIndex(s => s.status === 'running');
      if (runningIndex >= 0) {
        updateStep(runningIndex, { status: "error", details: error.message });
      }
    } finally {
      setIsRunning(false);
      if (groupId) {
        await supabase.from('groups').delete().eq('id', groupId);
      }
    }
  };

  const getIcon = (status: ChatStep['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-red-700" />
            <CardTitle>Test Système de Chat</CardTitle>
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
