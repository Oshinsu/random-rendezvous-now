import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter = () => {
  const { notifications, unreadCount, markAsRead } = useAdminNotifications();
  const navigate = useNavigate();

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'default';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications Admin</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} non lues</Badge>
            )}
          </div>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune notification
                </p>
              ) : (
                notifications.map((notification) => (
                  <Alert 
                    key={notification.id} 
                    variant={getAlertVariant(notification.type)}
                    className={notification.read ? 'opacity-60' : ''}
                  >
                    <AlertTitle className="text-sm font-semibold">
                      {notification.title}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {notification.message}
                      {notification.actionUrl && (
                        <Button 
                          size="sm" 
                          variant="link" 
                          className="mt-2 p-0 h-auto"
                          onClick={() => {
                            navigate(notification.actionUrl!);
                            markAsRead(notification.id);
                          }}
                        >
                          {notification.actionLabel} →
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
