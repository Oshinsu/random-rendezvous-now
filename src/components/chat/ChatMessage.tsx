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
    <div className={`flex ${
      message.is_system ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'
    } animate-fade-in`}>
      <div
        className={`max-w-[90%] ${!message.is_system ? 'min-w-[180px]' : ''} p-3 rounded-2xl transition-all duration-200 border ${
          message.is_system
            ? 'bg-primary/10 border-primary/20'
            : isOwnMessage
            ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-transparent shadow-medium'
            : 'bg-card border-border shadow-sm'
        }`}
      >
        <div className="flex justify-between items-start gap-2 mb-1">
          <span className={`text-xs font-semibold ${
            message.is_system ? 'text-primary' : isOwnMessage ? 'text-white/90' : 'text-foreground/80'
          }`}>
            {sender}
          </span>
          <span className={`${isOwnMessage ? 'text-white/70' : 'text-muted-foreground'} text-[10px]`}
          >
            {formatTime(message.created_at)}
          </span>
        </div>
        <p className={`text-sm mb-2 ${
          message.is_system ? 'text-foreground' : isOwnMessage ? 'text-white' : 'text-foreground'
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
    </div>
  );
};

export default ChatMessage;
