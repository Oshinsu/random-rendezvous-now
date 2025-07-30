
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { SessionMonitoringService } from '@/services/sessionMonitoringService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
    // Start session monitoring
    SessionMonitoringService.startMonitoring();
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id);
        
        // PROTECTION: Prevent spurious logouts during active operations
        if (event === 'SIGNED_OUT' && session === null) {
          // Check if logout was intentional or caused by an error
          const currentTime = Date.now();
          const timeSinceLastActivity = currentTime - ((window as any).lastActivity || 0);
          const criticalOpInProgress = (window as any).criticalOperationInProgress;
          
          // Enhanced protection during critical operations or recent activity
          if (timeSinceLastActivity < 30000 || criticalOpInProgress) {
            console.warn('⚠️ Potentially spurious logout detected during critical operation, attempting session recovery...');
            
            // Add enhanced logging for debugging
            console.log('📊 Session Protection Info:', {
              timeSinceLastActivity,
              criticalOpInProgress,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            });
            
            // Attempt to recover session with retries
            let recoveryAttempts = 0;
            const maxRecoveryAttempts = 3;
            
            const attemptRecovery = async (): Promise<void> => {
              recoveryAttempts++;
              
              try {
                const { data: { session: recoveredSession }, error } = await supabase.auth.getSession();
                
                if (error) {
                  console.warn(`⚠️ Recovery attempt ${recoveryAttempts} failed:`, error);
                  if (recoveryAttempts < maxRecoveryAttempts) {
                    setTimeout(attemptRecovery, 1000 * recoveryAttempts);
                    return;
                  }
                }
                
                if (recoveredSession) {
                  console.log('✅ Session recovered successfully on attempt', recoveryAttempts);
                  setSession(recoveredSession);
                  setUser(recoveredSession.user);
                  return;
                }
                
                // If all recovery attempts fail, proceed with logout
                console.log('❌ All session recovery attempts failed, proceeding with logout');
                setSession(null);
                setUser(null);
                navigate('/auth');
              } catch (error) {
                console.error('❌ Session recovery error:', error);
                if (recoveryAttempts >= maxRecoveryAttempts) {
                  setSession(null);
                  setUser(null);
                  navigate('/auth');
                }
              }
            };
            
            setTimeout(attemptRecovery, 1000);
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle navigation based on auth events
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in successfully');
          // Don't auto-navigate here to avoid conflicts
        }
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          navigate('/auth');
        }
        
        // Only set loading to false after we've processed the auth state
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
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

  const value = {
    session,
    user,
    loading,
    signOut,
    signInWithGoogle,
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
