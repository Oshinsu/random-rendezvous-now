
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Trash2 } from 'lucide-react';
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
  const { messages, loading, sending, sendMessage, refreshMessages } = useGroupChat(groupId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll automatique seulement pour les nouveaux messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      scrollToBottom();
      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    console.log('📤 Envoi du message:', newMessage);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
      console.log('✅ Message envoyé et input vidé');
      // Focus sur l'input après envoi
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      console.error('❌ Échec de l\'envoi du message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    // Pour les autres utilisateurs, utiliser un nom anonyme basé sur l'ID
    const userId = message.user_id;
    const userIndex = userId ? userId.slice(-4) : 'Anon';
    return `Aventurier ${userIndex}`;
  };

  // Fonction pour rafraîchir manuellement les messages
  const handleRefresh = () => {
    console.log('🔄 Actualisation manuelle du chat');
    refreshMessages();
  };

  // Ne pas afficher le chat si l'utilisateur n'est pas connecté
  if (!user) {
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
            <p>Connectez-vous pour accéder au chat</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canUseChat = groupId && user;

  if (!canUseChat) {
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
            <p>En attente de membres...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrer les messages pour éviter l'affichage de doublons côté UI aussi
  const uniqueMessages = messages.filter((message, index, self) => 
    index === self.findIndex(m => m.id === message.id)
  );

  console.log('🔍 [GroupChat] Rendu avec messages uniques:', uniqueMessages.length);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat du groupe
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Users className="h-3 w-3 mr-1" />
              {uniqueMessages.length}
            </Badge>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone des messages */}
        <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
          {loading && uniqueMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>Chargement des messages...</p>
            </div>
          ) : uniqueMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium">💬 Bienvenue dans le chat !</p>
                <p className="text-blue-600 text-sm mt-1">
                  Présentez-vous et préparez votre aventure ensemble
                </p>
              </div>
              <p>Soyez le premier à écrire un message !</p>
            </div>
          ) : (
            <>
              {uniqueMessages.map((message, index) => {
                const sender = getMessageSender(message);
                const isOwnMessage = message.user_id === user?.id && !message.is_system;
                
                return (
                  <div
                    key={`${message.id}-${index}`}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      message.is_system
                        ? 'bg-blue-100 border border-blue-200 text-blue-800'
                        : isOwnMessage
                        ? 'bg-brand-100 ml-8 border border-brand-200'
                        : 'bg-white mr-8 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-semibold ${
                        message.is_system ? 'text-blue-700' : isOwnMessage ? 'text-brand-700' : 'text-gray-700'
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
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie améliorée */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1"
            maxLength={500}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
            className="px-4 bg-brand-500 hover:bg-brand-600"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Indicateur de caractères */}
        {newMessage.length > 400 && (
          <div className="text-xs text-gray-500 text-right">
            {newMessage.length}/500 caractères
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupChat;
