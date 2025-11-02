import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PushPreviewDeviceProps {
  deviceType: 'iphone' | 'android';
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
    icon?: string;
  };
}

export const PushPreviewDevice = ({ deviceType, notification }: PushPreviewDeviceProps) => {
  return (
    <div className="flex justify-center">
      <div className={`relative ${deviceType === 'iphone' ? 'w-[375px] h-[667px]' : 'w-[360px] h-[640px]'} bg-black rounded-[2.5rem] border-8 border-gray-800 shadow-2xl overflow-hidden`}>
        {/* Notch pour iPhone */}
        {deviceType === 'iphone' && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10" />
        )}
        
        {/* Écran */}
        <div className="w-full h-full bg-gray-900 p-4 pt-12 overflow-y-auto">
          {/* Notification Preview */}
          <Card className="bg-white p-4 shadow-lg rounded-xl border-0">
            <div className="flex items-start gap-3">
              {notification.icon && (
                <img 
                  src={notification.icon} 
                  alt="App icon" 
                  className="w-10 h-10 rounded-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500">Random</span>
                  <span className="text-xs text-gray-400">maintenant</span>
                </div>
                <h4 className="font-bold text-sm mb-1 text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-700">{notification.body}</p>
                {notification.imageUrl && (
                  <img 
                    src={notification.imageUrl} 
                    alt="Notification" 
                    className="w-full h-32 object-cover rounded-lg mt-3"
                  />
                )}
              </div>
            </div>
          </Card>
          
          {/* Indicateur de type */}
          <div className="text-center mt-4">
            <Badge variant="outline" className="bg-gray-800 text-white border-gray-700">
              {deviceType === 'iphone' ? 'iPhone' : 'Android'}
            </Badge>
          </div>
        </div>
        
        {/* Bouton home iPhone */}
        {deviceType === 'iphone' && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gray-700 rounded-full" />
        )}
      </div>
    </div>
  );
};
