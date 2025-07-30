
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import AuthRateLimitHandler from '@/utils/authRateLimitHandler';
import { toast } from '@/hooks/use-toast';
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  rateLimitStatus: { isBlocked: boolean; remainingSeconds: number; canRetry: boolean };
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  forceReconnect: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimitStatus, setRateLimitStatus] = useState(AuthRateLimitHandler.getStatus());
  const navigate = useNavigate();

  // Update rate limit status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitStatus(AuthRateLimitHandler.getStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simple auth state listener with rate limiting protection
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle navigation based on auth events
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in successfully');
          // Reset rate limiting on successful sign in
          AuthRateLimitHandler.reset();
        }
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          navigate('/auth');
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session with rate limiting protection
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
        
        // Handle rate limiting errors
        if (AuthRateLimitHandler.handleRateLimitError(error)) {
          setRateLimitStatus(AuthRateLimitHandler.getStatus());
        }
        
        setLoading(false);
        return;
      }
      
      console.log('🔍 Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out user...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Error signing out:', error);
        throw error;
      }
      
      // onAuthStateChange will handle state updates and navigation
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      // Still clear local state on error
      setSession(null);
      setUser(null);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔐 Signing in with Google...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        console.error('❌ Google sign in error:', error);
        
        // Handle rate limiting errors
        if (AuthRateLimitHandler.handleRateLimitError(error)) {
          setRateLimitStatus(AuthRateLimitHandler.getStatus());
        }
        
        throw error;
      }
      
      console.log('✅ Google sign in initiated');
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forceReconnect = async (): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔄 Force reconnect attempt...');
      
      const success = await AuthRateLimitHandler.forceReconnect();
      setRateLimitStatus(AuthRateLimitHandler.getStatus());
      
      if (success) {
        // Force a fresh session check
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session) {
          setSession(session);
          setUser(session.user);
        }
      }
      
      return success;
    } catch (error) {
      console.error('❌ Force reconnect failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    rateLimitStatus,
    signOut,
    signInWithGoogle,
    forceReconnect,
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
