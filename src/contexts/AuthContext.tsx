
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

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle navigation based on auth events
        if (event === 'SIGNED_OUT') {
          navigate('/');
        }
        
        // Only set loading to false after we've processed the auth state
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

  const refreshSession = async () => {
    try {
      setLoading(true);
      console.log('🔄 Forcing session refresh...');
      
      // First try to refresh the token
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh error:', error);
        
        // If refresh fails, try to get current session
        const { data: { session: currentSession }, error: getError } = await supabase.auth.getSession();
        
        if (getError) {
          console.error('❌ Get session error:', getError);
          // Force sign out if both fail
          setSession(null);
          setUser(null);
          return false;
        }
        
        if (currentSession) {
          console.log('✅ Using existing session instead');
          setSession(currentSession);
          setUser(currentSession.user);
          return true;
        } else {
          console.log('❌ No valid session found');
          setSession(null);
          setUser(null);
          return false;
        }
      }
      
      console.log('✅ Session refreshed successfully:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      return !!session;
    } catch (error) {
      console.error('❌ Unexpected error during session refresh:', error);
      setSession(null);
      setUser(null);
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
