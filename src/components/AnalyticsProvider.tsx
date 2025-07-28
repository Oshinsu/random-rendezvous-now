import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useErrorTracking } from '@/hooks/useErrorTracking';

// Component to handle analytics and error tracking after AuthProvider is established
const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session, signOut: originalSignOut } = useAuth();
  const { track } = useAnalytics();
  useErrorTracking();

  // Create a wrapped signOut function that includes tracking
  useEffect(() => {
    // Override the global signOut to include analytics
    if (typeof window !== 'undefined') {
      (window as any).trackLogout = () => {
        track('logout', {
          user_id: user?.id,
          session_duration: session ? Date.now() - new Date(session.expires_at || 0).getTime() : null
        });
      };
    }
  }, [user, session, track]);

  return <>{children}</>;
};

export default AnalyticsProvider;