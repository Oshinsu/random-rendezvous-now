
import { useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUnifiedGroupChat } from '@/hooks/useUnifiedGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { logger } from '@/utils/cleanLogging';

interface GroupChatProps {
  groupId: string;
  isGroupComplete: boolean;
  barName?: string;
}

const GroupChat = ({ groupId, isGroupComplete, barName }: GroupChatProps) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, refreshMessages } = useUnifiedGroupChat(groupId);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus moins agressif - seulement au premier chargement
  useEffect(() => {
    if (inputRef.current && !loading && messages.length === 0) {
      // Délai pour éviter les conflits avec Lovable
      const timer = setTimeout(() => {
        if (inputRef.current && document.activeElement === document.body) {
          inputRef.current.focus();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, groupId]); // Retirer messages.length des dépendances

  const handleRefresh = () => {
    logger.info('Manual chat refresh');
    refreshMessages();
  };

  if (!user) {
    return (
      <Card className="w-full">
        <ChatHeader messageCount={0} loading={false} onRefresh={() => {}} />
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Connectez-vous pour accéder au chat</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!groupId) {
    return (
      <Card className="w-full">
        <ChatHeader messageCount={0} loading={false} onRefresh={() => {}} />
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>En attente de membres...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full glass-card">
      <ChatHeader 
        messageCount={messages.length}
        loading={loading}
        onRefresh={handleRefresh}
      />
      <CardContent className="space-y-4">
        <ChatMessages 
          messages={messages}
          loading={loading}
          userId={user?.id}
        />
        <ChatInput
          onSendMessage={sendMessage}
          sending={sending}
          inputRef={inputRef}
        />
      </CardContent>
    </Card>
  );
};

export default GroupChat;
