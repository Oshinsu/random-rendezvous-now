// Monitoring minimal et simple pour remplacer le système complexe
export class SimpleSessionMonitor {
  private static lastAuthCheck = Date.now();

  static logEvent(eventType: string, metadata?: any) {
    console.log(`📊 [SIMPLE MONITOR] ${eventType}:`, metadata);
  }

  static async checkSession(): Promise<boolean> {
    const now = Date.now();
    
    // Only check every 30 seconds minimum to avoid spam
    if (now - this.lastAuthCheck < 30000) {
      return true;
    }
    
    this.lastAuthCheck = now;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('⚠️ [SIMPLE MONITOR] Session check failed:', error);
        return false;
      }
      
      return !!session;
    } catch (error) {
      console.warn('⚠️ [SIMPLE MONITOR] Session check error:', error);
      return false;
    }
  }

  static getHealthStatus() {
    return {
      timestamp: new Date().toISOString(),
      lastCheck: new Date(this.lastAuthCheck).toISOString(),
      status: 'monitoring'
    };
  }
}