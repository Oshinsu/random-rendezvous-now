import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatbotAnalyticsDashboard } from '@/components/admin/chatbot/ChatbotAnalyticsDashboard';

type Message = { role: 'user' | 'assistant'; content: string };

const AdminChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    // Récupérer le session token de l'utilisateur connecté
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour utiliser le chatbot.",
        variant: "destructive",
      });
      return;
    }

    const CHAT_URL = `https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/admin-chat`;
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`, // ✅ TOKEN UTILISATEUR
      },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    if (resp.status === 429) {
      toast({
        title: "Rate limit dépassé",
        description: "Trop de requêtes, réessayez dans quelques instants.",
        variant: "destructive",
      });
      return;
    }

    if (resp.status === 402) {
      toast({
        title: "Paiement requis",
        description: "Crédits Lovable AI insuffisants.",
        variant: "destructive",
      });
      return;
    }

    if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";

    const updateAssistantMessage = (content: string) => {
      assistantContent = content;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        }
        return [...prev, { role: "assistant", content }];
      });
    };

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            updateAssistantMessage(assistantContent);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            updateAssistantMessage(assistantContent);
          }
        } catch { /* ignore */ }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(userMsg);
    } catch (e) {
      console.error(e);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec l'IA.",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            💬 Chatbot IA SOTA 2025
          </h1>
          <p className="text-muted-foreground mt-2">
            Analytics + Prompt Engineering + RAG-ready
          </p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat en direct</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <Card className="border-red-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-red-600" />
                  Assistant IA Random
                </CardTitle>
                <CardDescription>
                  Posez vos questions sur les statistiques, tendances et insights de votre application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea ref={scrollRef} className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Commencez une conversation avec l'assistant IA</p>
                        <p className="text-sm mt-2">
                          Exemple: "Combien d'utilisateurs actifs aujourd'hui ?"
                        </p>
                      </div>
                    )}
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                            msg.role === 'user'
                              ? 'bg-red-600 text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-red-600 animate-pulse" />
                        </div>
                        <div className="rounded-2xl px-4 py-2 bg-muted">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-red-600/50 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-red-600/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-2 h-2 bg-red-600/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Posez votre question..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <ChatbotAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminChatbot;
