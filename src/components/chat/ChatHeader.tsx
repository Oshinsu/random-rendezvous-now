
import { MessageCircle, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';

interface ChatHeaderProps {
  messageCount: number;
  loading: boolean;
  onRefresh: () => void;
}

const ChatHeader = ({ messageCount, loading, onRefresh }: ChatHeaderProps) => {
  return (
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span>Chat du groupe</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {messageCount}
          </Badge>
          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Rafraîchir les messages"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardTitle>
    </CardHeader>
  );
};

export default ChatHeader;
