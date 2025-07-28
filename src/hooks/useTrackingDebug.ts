import { useEffect, useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface TrackingDebugInfo {
  totalEvents: number;
  recentEvents: Array<{
    event: string;
    timestamp: string;
    properties?: Record<string, any>;
  }>;
  gtmStatus: 'connected' | 'disconnected' | 'unknown';
}

export const useTrackingDebug = () => {
  const { getEvents } = useAnalytics();
  const [debugInfo, setDebugInfo] = useState<TrackingDebugInfo>({
    totalEvents: 0,
    recentEvents: [],
    gtmStatus: 'unknown'
  });

  useEffect(() => {
    const updateDebugInfo = () => {
      const events = getEvents();
      const recentEvents = events.slice(-10).map(event => ({
        event: event.event,
        timestamp: event.properties?.timestamp || new Date().toISOString(),
        properties: event.properties
      }));

      // Check GTM status
      const gtmStatus = typeof window !== 'undefined' && window.dataLayer 
        ? 'connected' 
        : 'disconnected';

      setDebugInfo({
        totalEvents: events.length,
        recentEvents,
        gtmStatus
      });
    };

    // Update initially
    updateDebugInfo();

    // Update every 5 seconds
    const interval = setInterval(updateDebugInfo, 5000);

    return () => clearInterval(interval);
  }, [getEvents]);

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