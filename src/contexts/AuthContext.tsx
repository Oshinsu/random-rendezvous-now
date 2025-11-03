
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // ✅ PHASE 1: Initialize session FIRST before setting up listeners
    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('❌ Auth initialization error:', error);
          setIsInitialized(true);
          setLoading(false);
          return;
        }
        
        console.log('✅ Auth initialized:', {
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsInitialized(true);
        setLoading(false);
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        if (isMounted) {
          setIsInitialized(true);
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initAuth();

    // THEN set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        console.log('🔐 Auth state change:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Navigation only on explicit SIGNED_OUT
        if (event === 'SIGNED_OUT' && !session) {
          console.log('🚪 SIGNED_OUT detected, navigating to home');
          setTimeout(() => navigate('/'), 100);
        }
        
        setLoading(false);
      }
    );

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
      
      const redirectUrl = `${window.location.origin}/`;
      console.log('🔐 [Google OAuth] Starting flow');
      console.log('🔐 [Google OAuth] Origin:', window.location.origin);
      console.log('🔐 [Google OAuth] Redirect To:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('🚨 [Google OAuth] Error:', error);
        throw error;
      }
      
      console.log('✅ [Google OAuth] Redirect initiated:', data);
    } catch (error) {
      console.error('🚨 [Google OAuth] Exception:', error);
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
    loading: !isInitialized || loading,
    isInitialized,
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
