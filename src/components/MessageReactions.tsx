
import React, { useState } from 'react';
import { Smile, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionClick = async (emoji: string) => {
    const success = await toggleReaction(messageId, emoji);
    if (success) {
      setShowEmojiPicker(false);
    }
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

      {/* Bouton pour ajouter une réaction */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="grid grid-cols-4 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactionsComponent;
