
import { MessageCircle, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChatHeaderProps {
  messageCount: number;
  loading: boolean;
  onRefresh: () => void;
}

const ChatHeader = ({ messageCount, loading, onRefresh }: ChatHeaderProps) => {
  const handleEnableNotifications = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        toast.success('Vous recevrez des alertes pour vos groupes.');
      } else {
        toast.error('Activez-les dans les paramètres du navigateur.');
      }
    } catch {}
  };
  return (
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span>Chat du groupe</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" aria-label={`Messages: ${messageCount}`}>
            <MessageCircle className="h-3 w-3 mr-1" />
            {messageCount}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            aria-label="Rafraîchir les messages"
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </Button>
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableNotifications}
              aria-label="Activer les notifications"
            >
              Activer
            </Button>
          )}
        </div>
      </CardTitle>
    </CardHeader>
  );
};

export default ChatHeader;
