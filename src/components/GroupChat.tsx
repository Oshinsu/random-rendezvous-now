
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

interface GroupChatProps {
  groupId: string;
  isGroupComplete: boolean;
  barName?: string;
}

const GroupChat = ({ groupId, isGroupComplete, barName }: GroupChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Ajouter un message système quand le groupe est complet
  useEffect(() => {
    if (isGroupComplete && barName) {
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        sender: 'Système',
        message: `🎉 Votre groupe est maintenant complet ! Rendez-vous au ${barName} dans environ 1 heure. Bon amusement !`,
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      
      setMessages(prev => {
        // Éviter les doublons de messages système
        if (prev.some(msg => msg.isSystem && msg.message.includes(barName))) {
          return prev;
        }
        return [...prev, systemMessage];
      });
    }
  }, [isGroupComplete, barName]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Vous',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isSystem: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simuler l'envoi du message (à remplacer par l'API réelle)
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isGroupComplete) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-600">
            <MessageCircle className="h-5 w-5" />
            Chat du groupe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Le chat sera disponible une fois le groupe complet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat du groupe
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Users className="h-3 w-3 mr-1" />
            Actif
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone des messages */}
        <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Soyez le premier à écrire un message !</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.isSystem
                    ? 'bg-blue-100 border border-blue-200 text-blue-800'
                    : message.sender === 'Vous'
                    ? 'bg-brand-100 ml-8 border border-brand-200'
                    : 'bg-white mr-8 border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-semibold ${
                    message.isSystem ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {message.sender}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className={`text-sm ${
                  message.isSystem ? 'text-blue-800' : 'text-gray-800'
                }`}>
                  {message.message}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupChat;
