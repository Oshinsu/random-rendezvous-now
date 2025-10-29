import { Bell, Check, Trash2, BellRing } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationCard } from './NotificationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const { status, requestPermission, isEnabled, canRequest } = usePushNotifications();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-[540px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'}
                </Badge>
              )}
            </SheetTitle>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-1 text-xs"
                >
                  <Check className="h-3 w-3" />
                  Tout marquer lu
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                  Tout effacer
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-3">
            {/* PHASE 5: Suppression du banner générique - utiliser PushPermissionModal contextuel */}
            {isEnabled && (
              <Alert className="bg-success/10 border-success/20">
                <BellRing className="h-4 w-4 text-success" />
                <AlertDescription className="text-sm text-success">
                  ✅ Notifications push actives
                </AlertDescription>
              </Alert>
            )}
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-24 w-full" />
                </div>
              ))
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucune notification</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Vous recevrez ici toutes vos notifications sur vos groupes, bars assignés et
                  nouveaux messages.
                </p>
              </div>
            ) : (
              // Notifications list
              <>
                {/* Unread notifications */}
                {notifications.some(n => !n.read_at) && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-sm text-muted-foreground">Non lues</h3>
                      <Separator className="flex-1" />
                    </div>
                    {notifications
                      .filter(n => !n.read_at)
                      .map(notification => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onRead={() => markAsRead(notification.id)}
                          onDelete={() => deleteNotification(notification.id)}
                        />
                      ))}
                  </>
                )}

                {/* Read notifications */}
                {notifications.some(n => n.read_at) && (
                  <>
                    <div className="flex items-center gap-2 mt-6 mb-3">
                      <h3 className="font-semibold text-sm text-muted-foreground">Lues</h3>
                      <Separator className="flex-1" />
                    </div>
                    {notifications
                      .filter(n => n.read_at)
                      .map(notification => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onRead={() => markAsRead(notification.id)}
                          onDelete={() => deleteNotification(notification.id)}
                        />
                      ))}
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 border-t bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};