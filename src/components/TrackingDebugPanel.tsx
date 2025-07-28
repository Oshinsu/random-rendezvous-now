import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Safe debug info without dependencies
const useSafeTrackingDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    totalEvents: 0,
    recentEvents: [] as Array<{
      event: string;
      timestamp: string;
      properties?: Record<string, any>;
    }>,
    gtmStatus: 'unknown' as 'connected' | 'disconnected' | 'unknown'
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      try {
        // Get analytics events from localStorage
        const analyticsEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        const performanceEvents = JSON.parse(localStorage.getItem('performance_events') || '[]');
        const allEvents = [...analyticsEvents, ...performanceEvents];
        
        const recentEvents = allEvents.slice(-10).map(event => ({
          event: event.event,
          timestamp: event.properties?.timestamp || event.timestamp || new Date().toISOString(),
          properties: event.properties
        }));

        // Check GTM status
        const gtmStatus = typeof window !== 'undefined' && window.dataLayer 
          ? 'connected' 
          : 'disconnected';

        setDebugInfo({
          totalEvents: allEvents.length,
          recentEvents,
          gtmStatus
        });
      } catch (error) {
        console.warn('Failed to load debug info:', error);
      }
    };

    // Update initially
    updateDebugInfo();

    // Update every 5 seconds
    const interval = setInterval(updateDebugInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  const logTrackingStatus = () => {
    console.group('🔍 Tracking Debug Status');
    console.log('Total Events:', debugInfo.totalEvents);
    console.log('GTM Status:', debugInfo.gtmStatus);
    console.log('Recent Events:', debugInfo.recentEvents);
    console.log('DataLayer:', typeof window !== 'undefined' ? window.dataLayer : 'Not available');
    console.groupEnd();
  };

  const validateGTMEvents = () => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      const gtmEvents = window.dataLayer.filter(item => item.event);
      console.log('🏷️ GTM Events in DataLayer:', gtmEvents.length);
      console.table(gtmEvents.slice(-5));
      return gtmEvents.length;
    }
    return 0;
  };

  return {
    debugInfo,
    logTrackingStatus,
    validateGTMEvents
  };
};

const TrackingDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { debugInfo, logTrackingStatus, validateGTMEvents } = useSafeTrackingDebug();

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