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
        page_title: document.title,
        session_id: this.getSessionId()
      }
    };

    this.events.push(analyticsEvent);
    
    // Log to console for development (less verbose for performance events)
    if (event !== 'performance_metrics') {
      console.log('📊 Analytics Event:', analyticsEvent);
    }
    
    // Envoyer à Google Tag Manager
    this.sendToGTM(event, analyticsEvent.properties);
    
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

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private sendToGTM(event: string, properties?: Record<string, any>) {
    try {
      // Initialiser dataLayer si nécessaire
      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        
        // Préparer les données pour GTM
        const gtmData = {
          event: event,
          user_id: this.userId,
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
          page_title: document.title,
          ...properties
        };

        // Envoyer à GTM
        window.dataLayer.push(gtmData);
        
        // Less verbose logging for performance events
        if (event !== 'performance_metrics') {
          console.log('🏷️ GTM Event Sent:', gtmData);
        }
      }
    } catch (error) {
      console.warn('Failed to send event to GTM:', error);
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
