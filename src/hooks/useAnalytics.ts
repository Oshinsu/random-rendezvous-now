import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

class SimpleAnalytics {
  private static instance: SimpleAnalytics;
  private events: AnalyticsEvent[] = [];
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
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
    };

    this.events.push(analyticsEvent);
    
    // Log to console for development
    console.log('📊 Analytics Event:', analyticsEvent);
    
    // Store in localStorage for persistence
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(analyticsEvent);
      
      // Keep only last 100 events to avoid storage bloat
      if (storedEvents.length > 100) {
        storedEvents.splice(0, storedEvents.length - 100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(storedEvents));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }

  getEvents(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch {
      return this.events;
    }
  }

  clearEvents() {
    this.events = [];
    localStorage.removeItem('analytics_events');
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

  const trackPageView = (pageName: string) => {
    track('page_view', { page: pageName });
  };

  const trackGroupAction = (action: string, groupId?: string) => {
    track('group_action', { action, groupId });
  };

  const trackUserAction = (action: string, details?: Record<string, any>) => {
    track('user_action', { action, ...details });
  };

  return {
    track,
    trackPageView,
    trackGroupAction,
    trackUserAction,
    getEvents: analytics.getEvents.bind(analytics),
    clearEvents: analytics.clearEvents.bind(analytics)
  };
};
