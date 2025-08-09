export type MarketingEventPayload = Record<string, any>;

export const pushEvent = (event: string, properties?: MarketingEventPayload) => {
  try {
    if (typeof window === 'undefined') return;
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event,
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Silently fail to avoid blocking UX
    console.warn('pushEvent failed', e);
  }
};
