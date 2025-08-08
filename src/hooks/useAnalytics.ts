import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

// Déclaration globale pour GTM dataLayer
declare global {
  interface Window {
    dataLayer: any[];
  }
}

class SimpleAnalytics {
  private static instance: SimpleAnalytics;
  private userId: string | null = null;

  static getInstance(): SimpleAnalytics {
    if (!SimpleAnalytics.instance) {
      SimpleAnalytics.instance = new SimpleAnalytics();
    }
    return SimpleAnalytics.instance;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  track(event: string, properties?: Record<string, any>) {
    // Only track the 5 essential events
    const allowedEvents = ['bar_visit', 'group_create', 'group_join', 'login', 'sign_up', 'scheduled_group_activated'];
    if (!allowedEvents.includes(event)) {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        user_id: this.userId,
        timestamp: new Date().toISOString()
      }
    };
    
    // Send to Google Tag Manager only
    this.sendToGTM(event, analyticsEvent.properties);
  }

  private sendToGTM(event: string, properties?: Record<string, any>) {
    try {
      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        
        const gtmData = {
          event: event,
          user_id: this.userId,
          ...properties
        };

        window.dataLayer.push(gtmData);
      }
    } catch (error) {
      console.warn('Failed to send event to GTM:', error);
    }
  }
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const analytics = SimpleAnalytics.getInstance();

  useEffect(() => {
    analytics.setUserId(user?.id || null);
  }, [user]);

  const track = (event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  };

  // Essential tracking functions for the 5 core events
  const trackSignUp = () => {
    track('sign_up');
  };

  const trackLogin = () => {
    track('login');
  };

  const trackGroupCreate = (groupId?: string) => {
    track('group_create', { group_id: groupId });
  };

  const trackGroupJoin = (groupId?: string) => {
    track('group_join', { group_id: groupId });
  };

  const trackBarVisit = (barName?: string, groupId?: string) => {
    track('bar_visit', { bar_name: barName, group_id: groupId });
  };

  return {
    track,
    trackSignUp,
    trackLogin,
    trackGroupCreate,
    trackGroupJoin,
    trackBarVisit
  };
};