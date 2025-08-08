
import React from 'react';
import { Button } from '@/components/ui/button';
import { useMessageReactions, MessageReactions } from '@/hooks/useMessageReactions';
import { useAuth } from '@/contexts/AuthContext';

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReactions;
  className?: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

const MessageReactionsComponent = ({ messageId, reactions, className = '' }: MessageReactionsProps) => {
  const { user } = useAuth();
  const { toggleReaction, loading } = useMessageReactions();

  const handleReactionClick = async (emoji: string) => {
    await toggleReaction(messageId, emoji);
  };

  const getReactionCount = (emoji: string) => {
    return reactions[emoji]?.length || 0;
  };

  const hasUserReacted = (emoji: string) => {
    return user ? reactions[emoji]?.includes(user.id) || false : false;
  };

  const existingReactions = Object.keys(reactions).filter(emoji => getReactionCount(emoji) > 0);

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {/* Réactions existantes */}
      {existingReactions.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className={`h-6 px-2 py-1 text-xs rounded-full border transition-all ${
            hasUserReacted(emoji)
              ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => handleReactionClick(emoji)}
          disabled={loading}
        >
          <span className="mr-1">{emoji}</span>
          <span>{getReactionCount(emoji)}</span>
        </Button>
      ))}

      {/* Ajout manuel retiré pour simplifier l’UI */}

    </div>
  );
};

export default MessageReactionsComponent;
