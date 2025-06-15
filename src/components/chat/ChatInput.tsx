
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<boolean>;
  sending: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ChatInput = ({ onSendMessage, sending, inputRef }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const success = await onSendMessage(newMessage);
    if (success) {
      setNewMessage('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-2">
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
      
      {newMessage.length > 400 && (
        <div className="text-xs text-gray-500 text-right">
          {newMessage.length}/500 caractères
        </div>
      )}
    </div>
  );
};

export default ChatInput;
