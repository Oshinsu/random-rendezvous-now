type CRMEventType = 'health-scores-updated' | 'segments-updated';
type EventListener = () => void;

class CRMEventBus {
  private listeners: Map<CRMEventType, Set<EventListener>> = new Map();

  subscribe(event: CRMEventType, callback: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return cleanup function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: CRMEventType) {
    this.listeners.get(event)?.forEach(callback => callback());
  }
}

export const crmEventBus = new CRMEventBus();
