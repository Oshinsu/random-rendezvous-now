
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGroupChat } from '@/hooks/useGroupChat';
import { useAuth } from '@/contexts/AuthContext';

interface GroupChatProps {
  groupId: string;
  isGroupComplete: boolean;
  barName?: string;
}

const GroupChat = ({ groupId, isGroupComplete, barName }: GroupChatProps) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, sendSystemMessage } = useGroupChat(groupId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Envoyer un message système quand le groupe est complet et qu'un bar est assigné
  useEffect(() => {
    if (isGroupComplete && barName && messages.length > 0) {
      // Vérifier s'il n'y a pas déjà un message système pour ce bar
      const hasSystemMessage = messages.some(
        msg => msg.is_system && msg.message.includes(barName)
      );
      
      if (!hasSystemMessage) {
        const systemMessageText = `🎉 Votre groupe est maintenant complet ! Rendez-vous au ${barName} dans environ 1 heure. Bon amusement !`;
        sendSystemMessage(systemMessageText);
      }
    }
  }, [isGroupComplete, barName, messages.length, sendSystemMessage]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageSender = (message: any) => {
    if (message.is_system) {
      return 'Système';
    }
    if (message.user_id === user?.id) {
      return 'Vous';
    }
    // Pour les autres utilisateurs, utiliser un nom masqué basé sur l'index
    const userMessages = messages.filter(m => !m.is_system && m.user_id !== user?.id);
    const uniqueUsers = [...new Set(userMessages.map(m => m.user_id))];
    const userIndex = uniqueUsers.indexOf(message.user_id);
    return userIndex >= 0 ? `Rander ${userIndex + 1}` : 'Utilisateur';
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
            {loading ? 'Chargement...' : 'Actif'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone des messages */}
        <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
          {loading && messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>Chargement des messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Soyez le premier à écrire un message !</p>
            </div>
          ) : (
            messages.map((message) => {
              const sender = getMessageSender(message);
              const isOwnMessage = message.user_id === user?.id && !message.is_system;
              
              return (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.is_system
                      ? 'bg-blue-100 border border-blue-200 text-blue-800'
                      : isOwnMessage
                      ? 'bg-brand-100 ml-8 border border-brand-200'
                      : 'bg-white mr-8 border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-semibold ${
                      message.is_system ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {sender}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    message.is_system ? 'text-blue-800' : 'text-gray-800'
                  }`}>
                    {message.message}
                  </p>
                </div>
              );
            })
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
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
            className="px-4"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupChat;
