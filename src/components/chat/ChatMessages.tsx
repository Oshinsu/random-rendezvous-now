import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '@/hooks/useUnifiedGroupChat';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  loading: boolean;
  userId?: string;
}

const ChatMessages = ({ messages, loading, userId }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      scrollToBottom();
      lastMessageCountRef.current = messages.length;
    }
  }, [messages]);

  const getMessageSender = (message: ChatMessageType, index: number) => {
    if (message.is_system) {
      return 'Système';
    }
    if (message.user_id === userId) {
      return 'Vous';
    }
    
    const uniqueUserIds = [...new Set(
      messages
        .filter(m => !m.is_system && m.user_id !== userId)
        .map(m => m.user_id)
    )];
    
    const userIndex = uniqueUserIds.indexOf(message.user_id);
    const userNumber = userIndex + 1;
    
    return `Aventurier ${userNumber}`;
  };

  if (loading && messages.length === 0) {
    return (
      <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
        <div className="text-center text-gray-500 mt-8">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
        <div className="text-center text-gray-500 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 font-medium">💬 Bienvenue dans le chat !</p>
            <p className="text-blue-600 text-sm mt-1">
              Présentez-vous et préparez votre aventure ensemble
            </p>
          </div>
          <p>Soyez le premier à écrire un message !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-3">
      {messages.map((message, index) => {
        const sender = getMessageSender(message, index);
        const isOwnMessage = message.user_id === userId && !message.is_system;
        
        return (
          <ChatMessage
            key={message.id}
            message={message}
            sender={sender}
            isOwnMessage={isOwnMessage}
            userId={userId}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
