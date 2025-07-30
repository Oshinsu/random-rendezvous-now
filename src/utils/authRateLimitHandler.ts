import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitState {
  isBlocked: boolean;
  blockedUntil: number;
  retryCount: number;
  lastError: number;
}

class AuthRateLimitHandler {
  private static state: RateLimitState = {
    isBlocked: false,
    blockedUntil: 0,
    retryCount: 0,
    lastError: 0
  };

  static isRateLimited(): boolean {
    return this.state.isBlocked && Date.now() < this.state.blockedUntil;
  }

  static handleRateLimitError(error: any): boolean {
    const is429Error = this.detect429Error(error);
    
    if (is429Error) {
      console.error('🚫 [AUTH RATE LIMIT] 429 détecté:', error);
      
      this.state.retryCount++;
      this.state.lastError = Date.now();
      
      // Exponential backoff: 30s, 60s, 2min, 5min, 10min
      const delays = [30, 60, 120, 300, 600];
      const delayIndex = Math.min(this.state.retryCount - 1, delays.length - 1);
      const delaySeconds = delays[delayIndex];
      
      this.state.isBlocked = true;
      this.state.blockedUntil = Date.now() + (delaySeconds * 1000);
      
      // Clear potentially corrupted auth state
      this.clearAuthStorage();
      
      // Show user-friendly message
      toast({
        title: 'Limite de connexion atteinte',
        description: `Veuillez attendre ${delaySeconds} secondes avant de réessayer.`,
        variant: 'destructive',
        duration: 10000
      });
      
      console.warn(`⏰ [AUTH RATE LIMIT] Blocage pour ${delaySeconds}s`);
      return true;
    }
    
    return false;
  }

  private static detect429Error(error: any): boolean {
    if (!error) return false;
    
    // Direct 429 status
    if (error.status === 429) return true;
    
    // Supabase error messages for rate limiting
    const rateLimitMessages = [
      'over_request_rate_limit',
      'rate limit',
      'too many requests',
      '429'
    ];
    
    const errorStr = JSON.stringify(error).toLowerCase();
    return rateLimitMessages.some(msg => errorStr.includes(msg));
  }

  static clearAuthStorage(): void {
    try {
      // Clear all auth-related localStorage items
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      
      authKeys.forEach(key => localStorage.removeItem(key));
      console.log('🧹 [AUTH RATE LIMIT] Storage auth nettoyé');
    } catch (error) {
      console.error('❌ [AUTH RATE LIMIT] Erreur nettoyage storage:', error);
    }
  }

  static async forceReconnect(): Promise<boolean> {
    if (this.isRateLimited()) {
      const remainingMs = this.state.blockedUntil - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      toast({
        title: 'Reconnexion impossible',
        description: `Attendez encore ${remainingSeconds} secondes.`,
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log('🔄 [AUTH RATE LIMIT] Tentative de reconnexion forcée');
      
      // Clear storage and reset state
      this.clearAuthStorage();
      this.reset();
      
      // Force refresh session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ [AUTH RATE LIMIT] Erreur reconnexion:', error);
        return false;
      }
      
      console.log('✅ [AUTH RATE LIMIT] Reconnexion réussie');
      return true;
    } catch (error) {
      console.error('❌ [AUTH RATE LIMIT] Erreur reconnexion:', error);
      return false;
    }
  }

  static reset(): void {
    this.state = {
      isBlocked: false,
      blockedUntil: 0,
      retryCount: 0,
      lastError: 0
    };
    console.log('🔄 [AUTH RATE LIMIT] État réinitialisé');
  }

  static getStatus() {
    const remainingMs = Math.max(0, this.state.blockedUntil - Date.now());
    return {
      isBlocked: this.state.isBlocked,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      retryCount: this.state.retryCount,
      canRetry: !this.isRateLimited()
    };
  }

  // Auto-reset when cooldown expires
  static startAutoReset(): void {
    setInterval(() => {
      if (this.state.isBlocked && Date.now() >= this.state.blockedUntil) {
        this.state.isBlocked = false;
        console.log('✅ [AUTH RATE LIMIT] Période de blocage terminée');
        
        toast({
          title: 'Reconnexion possible',
          description: 'Vous pouvez maintenant vous reconnecter.',
          variant: 'default'
        });
      }
    }, 5000); // Check every 5 seconds
  }
}

// Start auto-reset mechanism
AuthRateLimitHandler.startAutoReset();

export default AuthRateLimitHandler;