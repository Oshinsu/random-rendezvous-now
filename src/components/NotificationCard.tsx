import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Notification } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notificationTracking } from '@/services/notificationTracking';

interface NotificationCardProps {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}

export const NotificationCard = ({ notification, onRead, onDelete }: NotificationCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = async () => {
    if (!notification.read_at) {
      onRead();
    }

    // Track click for analytics
    if (user?.id && notification.action_url) {
      await notificationTracking.trackClick(notification.id, user.id, 'card_click');
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bar_assigned':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'group_full':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'new_message':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'group_reminder':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'system':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bar_assigned':
        return 'Bar assigné';
      case 'group_full':
        return 'Groupe complet';
      case 'new_message':
        return 'Nouveau message';
      case 'group_reminder':
        return 'Rappel';
      case 'system':
        return 'Système';
      default:
        return type;
    }
  };

  return (
    <Card
      className={`p-4 transition-all cursor-pointer hover:shadow-md ${
        notification.read_at ? 'bg-background' : 'bg-accent/30 border-l-4 border-l-primary'
      }`}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        {notification.icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <img src={notification.icon} alt="" className="w-6 h-6" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <Badge variant="outline" className={`text-xs ${getTypeColor(notification.type)}`}>
                {getTypeLabel(notification.type)}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>

          {/* Image preview */}
          {notification.image && (
            <img
              src={notification.image}
              alt=""
              className="rounded-md max-h-32 object-cover mb-2"
            />
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>

            {notification.action_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                <ExternalLink className="h-3 w-3" />
                Voir
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};