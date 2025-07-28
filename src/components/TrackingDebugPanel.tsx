import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackingDebug } from '@/hooks/useTrackingDebug';

const TrackingDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { debugInfo, logTrackingStatus, validateGTMEvents } = useTrackingDebug();

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur"
        >
          🔍 Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur border shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Tracking Debug</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span>GTM Status:</span>
            <Badge variant={debugInfo.gtmStatus === 'connected' ? 'default' : 'destructive'}>
              {debugInfo.gtmStatus}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span>Total Events:</span>
            <Badge variant="outline">{debugInfo.totalEvents}</Badge>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium">Recent Events:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {debugInfo.recentEvents.map((event, index) => (
                <div key={index} className="text-xs p-1 bg-gray-50 rounded">
                  <div className="font-mono text-blue-600">{event.event}</div>
                  <div className="text-gray-500 text-[10px]">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              onClick={logTrackingStatus}
              size="sm"
              variant="outline"
              className="text-xs h-6 px-2"
            >
              Log Status
            </Button>
            <Button
              onClick={validateGTMEvents}
              size="sm"
              variant="outline"
              className="text-xs h-6 px-2"
            >
              Check GTM
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingDebugPanel;