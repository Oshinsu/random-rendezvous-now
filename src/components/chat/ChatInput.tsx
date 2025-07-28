
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<boolean>;
  sending: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
}

const ChatInput = ({ onSendMessage, sending, inputRef }: ChatInputProps) => {
  const [newMessage, setNewMessage] = useState('');
  const { track } = useAnalytics();

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    // Track message sending
    track('message_send', {
      message_length: newMessage.length,
      message_type: 'text',
      timestamp: new Date().toISOString()
    });

    const success = await onSendMessage(newMessage);
    if (success) {
      track('message_sent_success', {
        message_length: newMessage.length
      });
      setNewMessage('');
      // Retirer l'auto-focus agressif qui interfère avec Lovable
    } else {
      track('message_sent_error', {
        message_length: newMessage.length
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFocus = () => {
    // Ne pas capturer le focus si l'utilisateur utilise l'interface Lovable
    const lovableElements = document.querySelectorAll('[data-lovable], .lovable-input, .lovable-textarea');
    if (lovableElements.length > 0) {
      const activeElement = document.activeElement;
      const isLovableActive = Array.from(lovableElements).some(el => 
        el === activeElement || el.contains(activeElement)
      );
      if (isLovableActive) {
        return;
      }
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
          onFocus={handleFocus}
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
