
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
          className="flex-1 rounded-2xl bg-muted/50 placeholder:text-muted-foreground"
          maxLength={500}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          size="sm"
          aria-label="Envoyer le message"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {newMessage.length > 400 && (
        <div className="text-2xs text-muted-foreground text-right">
          {newMessage.length}/500 caractères
        </div>
      )}
    </div>
  );
};

export default ChatInput;
