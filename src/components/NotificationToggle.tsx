import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const NotificationToggle = () => {
  const { status, requestPermission, isEnabled } = usePushNotifications();
  
  const handleToggle = async () => {
    if (isEnabled) {
      toast.info('Les notifications sont déjà activées');
      return;
    }
    
    try {
      await requestPermission();
      toast.success('🔔 Notifications activées !');
    } catch (error) {
      toast.error('Permission refusée');
    }
  };
  
  if (!status.isSupported) {
    return null;
  }
  
  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      className="w-full"
    >
      {isEnabled ? (
        <>
          <Bell className="h-4 w-4 mr-2" />
          Notifs activées
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4 mr-2" />
          Activer notifs
        </>
      )}
    </Button>
  );
};
