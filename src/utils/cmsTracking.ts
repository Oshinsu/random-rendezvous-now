import { supabase } from "@/integrations/supabase/client";

// Generate or retrieve session ID
let sessionId: string | null = null;

const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('cms_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('cms_session_id', sessionId);
    }
  }
  return sessionId;
};

interface TrackEventParams {
  section: string;
  eventType: 'view' | 'click' | 'conversion' | 'bounce';
  metadata?: Record<string, any>;
}

export const trackCMSEvent = async ({ section, eventType, metadata = {} }: TrackEventParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('cms_page_analytics').insert({
      page_section: section,
      event_type: eventType,
      event_metadata: metadata,
      user_id: user?.id || null,
      session_id: getSessionId(),
    });

    console.log(`[CMS Tracking] ${eventType} on ${section}`, metadata);
  } catch (error) {
    console.error('[CMS Tracking] Error:', error);
  }
};

// Track page section view
export const trackSectionView = (section: string) => {
  trackCMSEvent({ section, eventType: 'view' });
};

// Track CTA click
export const trackCTAClick = (section: string, ctaLabel: string) => {
  trackCMSEvent({ 
    section, 
    eventType: 'click', 
    metadata: { cta_label: ctaLabel } 
  });
};

// Track conversion (signup)
export const trackConversion = (section: string) => {
  trackCMSEvent({ 
    section, 
    eventType: 'conversion',
    metadata: { conversion_type: 'signup' }
  });
};

// Track bounce (leave section quickly)
export const trackBounce = (section: string, timeSpent: number) => {
  if (timeSpent < 3000) { // Less than 3 seconds = bounce
    trackCMSEvent({ 
      section, 
      eventType: 'bounce',
      metadata: { time_spent_ms: timeSpent }
    });
  }
};
