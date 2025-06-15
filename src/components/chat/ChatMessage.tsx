import MessageReactions from '@/components/MessageReactions';
import { ChatMessage as ChatMessageType } from '@/hooks/useUnifiedGroupChat';

interface ChatMessageProps {
  message: ChatMessageType;
  sender: string;
  isOwnMessage: boolean;
  userId?: string;
}

const ChatMessage = ({ message, sender, isOwnMessage }: ChatMessageProps) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
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
      <p className={`text-sm mb-2 ${
        message.is_system ? 'text-blue-800' : 'text-gray-800'
      }`}>
        {message.message}
      </p>
      
      {!message.is_system && (
        <MessageReactions
          messageId={message.id}
          reactions={message.reactions || {}}
          className="mt-2"
        />
      )}
    </div>
  );
};

export default ChatMessage;
