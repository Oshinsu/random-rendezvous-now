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

  // Détection du type de message système pour icônes contextuelles
  const getSystemIcon = () => {
    const msg = message.message.toLowerCase();
    if (msg.includes('rejoint') || msg.includes('joined')) return '👋';
    if (msg.includes('quitté') || msg.includes('left')) return '🚪';
    if (msg.includes('bienvenue') || msg.includes('welcome')) return '🎉';
    if (msg.includes('bar') && msg.includes('assigné')) return '🍹';
    if (msg.includes('groupe complet')) return '✨';
    return '💬';
  };

  return (
    <div className={`flex ${
      message.is_system ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'
    } animate-fade-in`}>
      <div
        className={`max-w-[90%] ${!message.is_system ? 'min-w-[180px]' : ''} p-3 rounded-2xl transition-all duration-200 border ${
          message.is_system
            ? 'bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/30 backdrop-blur-sm'
            : isOwnMessage
            ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-transparent shadow-medium'
            : 'bg-card border-border shadow-sm'
        }`}
      >
        {message.is_system && (
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-base">{getSystemIcon()}</span>
            <span className="text-xs font-semibold text-primary">
              {sender}
            </span>
          </div>
        )}
        {!message.is_system && (
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className={`text-xs font-semibold ${
              isOwnMessage ? 'text-white/90' : 'text-foreground/80'
            }`}>
              {sender}
            </span>
            <span className={`${isOwnMessage ? 'text-white/70' : 'text-muted-foreground'} text-[10px]`}>
              {formatTime(message.created_at)}
            </span>
          </div>
        )}
        <p className={`text-sm mb-2 ${
          message.is_system 
            ? 'text-center text-foreground/90 font-medium' 
            : isOwnMessage ? 'text-white' : 'text-foreground'
        }`}>
          {message.message}
        </p>
        {message.is_system && (
          <p className="text-center text-[10px] text-muted-foreground/70">
            {formatTime(message.created_at)}
          </p>
        )}
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
