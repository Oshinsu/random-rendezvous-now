
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // PLAN D'URGENCE: Navigation uniquement sur vrais sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // PLAN D'URGENCE: Navigation seulement sur SIGNED_OUT explicite
        if (event === 'SIGNED_OUT' && !session) {
          setTimeout(() => navigate('/'), 100);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session with debouncing
    const checkSession = async () => {
      if (!isMounted) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error && error.message !== '429') {
        throw error;
      }
      
      // onAuthStateChange will handle state updates and navigation
    } catch (error: any) {
      // Still clear local state on error
      setSession(null);
      setUser(null);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      console.log('Starting Google OAuth with redirect to:', `${window.location.origin}/auth/v1/callback`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/v1/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (retryCount = 0, maxRetries = 1) => {
    try {
      setLoading(true);
      
      // PLAN D'URGENCE: Rate limiting avant toute tentative de refresh
      const { RateLimiter, RATE_LIMITS } = await import('@/utils/rateLimiter');
      if (RateLimiter.isRateLimited('session_refresh', RATE_LIMITS.SESSION_REFRESH)) {
        console.log('🚫 Session refresh circuit breaker activated (URGENCE)');
        return false;
      }
      
      console.log(`🔄 Session refresh (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        // PLAN D'URGENCE: Plus de retry, juste return false
        console.error('❌ Session refresh failed (no retry):', error);
        return false;
      }
      
      console.log('✅ Session refreshed successfully:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      return !!session;
    } catch (error) {
      // PLAN D'URGENCE: Plus de retry
      console.error('❌ Session refresh failed (no retry):', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    signInWithGoogle,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
