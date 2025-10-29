import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, Radio, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface RealtimeEvent {
  timestamp: string;
  table: string;
  eventType: string;
  payload: any;
  latency?: number;
}

export const RealtimeTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'listening' | 'testing' | 'success' | 'error'>('idle');
  const [groupsChannel, setGroupsChannel] = useState<any>(null);
  const [messagesChannel, setMessagesChannel] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (groupsChannel) supabase.removeChannel(groupsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
    };
  }, [groupsChannel, messagesChannel]);

  const runTest = async () => {
    setIsRunning(true);
    setTestStatus('listening');
    setEvents([]);
    let testGroupId: string | null = null;

    // Timeout global pour éviter tests infinis
    const testTimeout = setTimeout(() => {
      if (testStatus === 'listening' || testStatus === 'testing') {
        setTestStatus('error');
        setIsRunning(false);
        toast.error("Timeout: Le test a pris trop de temps (>30s)");
      }
    }, 30000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const testStartTime = Date.now();

      // Setup realtime listeners avec latence correcte
      const groupsCh = supabase
        .channel('groups-test-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'groups' },
          (payload) => {
            const eventReceivedTime = Date.now();
            const latency = eventReceivedTime - testStartTime;
            setEvents(prev => [...prev, {
              timestamp: new Date().toISOString(),
              table: 'groups',
              eventType: payload.eventType,
              payload: payload,
              latency: latency
            }]);
          }
        )
        .subscribe();

      const messagesCh = supabase
        .channel('messages-test-channel')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'group_messages' },
          (payload) => {
            const eventReceivedTime = Date.now();
            const latency = eventReceivedTime - testStartTime;
            setEvents(prev => [...prev, {
              timestamp: new Date().toISOString(),
              table: 'group_messages',
              eventType: payload.eventType,
              payload: payload,
              latency: latency
            }]);
          }
        )
        .subscribe();

      setGroupsChannel(groupsCh);
      setMessagesChannel(messagesCh);

      // Wait for subscription
      await new Promise(r => setTimeout(r, 1000));

      setTestStatus('testing');

      // Create group (should trigger INSERT event)
      const insertStart = Date.now();
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          location_name: "Test Realtime",
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

      // Wait for INSERT event
      await new Promise(r => setTimeout(r, 2000));

      // Update group (should trigger UPDATE event)
      const updateStart = Date.now();
      await supabase
        .from('groups')
        .update({ 
          current_participants: 3,
          status: 'confirmed'
        })
        .eq('id', group.id);

      await new Promise(r => setTimeout(r, 2000));

      // Insert message (should trigger INSERT event)
      await supabase
        .from('group_messages')
        .insert({
          group_id: group.id,
          user_id: user.id,
          message: "Test realtime message",
          is_system: false
        });

      await new Promise(r => setTimeout(r, 2000));

      // Check if we received events
      const hasGroupInsert = events.some(e => e.table === 'groups' && e.eventType === 'INSERT');
      const hasGroupUpdate = events.some(e => e.table === 'groups' && e.eventType === 'UPDATE');
      const hasMessage = events.some(e => e.table === 'group_messages' && e.eventType === 'INSERT');

      if (hasGroupInsert && hasGroupUpdate && hasMessage) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }

    } catch (error: any) {
      console.error("Realtime test error:", error);
      setTestStatus('error');
    } finally {
      clearTimeout(testTimeout);
      setIsRunning(false);
      
      // Cleanup
      if (testGroupId) {
        await supabase.from('groups').delete().eq('id', testGroupId);
      }
      
      if (groupsChannel) supabase.removeChannel(groupsChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
    }
  };

  const getStatusBadge = () => {
    switch (testStatus) {
      case 'listening':
        return <Badge className="bg-blue-500"><Radio className="mr-1 h-3 w-3" /> Écoute...</Badge>;
      case 'testing':
        return <Badge className="bg-yellow-500"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Test...</Badge>;
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" /> Succès</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Échec</Badge>;
      default:
        return <Badge variant="outline">Inactif</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-700" />
            <CardTitle>Test Système Realtime</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button onClick={runTest} disabled={isRunning} size="sm">
              {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Lancer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.table === 'groups').length}
              </div>
              <div className="text-xs text-gray-600">Événements Groups</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {events.filter(e => e.table === 'group_messages').length}
              </div>
              <div className="text-xs text-gray-600">Événements Messages</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {events.length > 0 ? Math.round(events.reduce((acc, e) => acc + (e.latency || 0), 0) / events.length) : 0}ms
              </div>
              <div className="text-xs text-gray-600">Latence moyenne</div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {events.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucun événement reçu
              </p>
            )}
            {events.map((event, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border text-xs">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs">
                    {event.table}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      event.eventType === 'INSERT' ? 'bg-green-50' :
                      event.eventType === 'UPDATE' ? 'bg-blue-50' :
                      'bg-red-50'
                    }`}
                  >
                    {event.eventType}
                  </Badge>
                  <span className="text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
                <div className="text-gray-600 font-mono text-xs">
                  {JSON.stringify(event.payload.new || event.payload.old, null, 2).substring(0, 150)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
