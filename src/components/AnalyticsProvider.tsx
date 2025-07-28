import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';

// Component to handle analytics after AuthProvider is established
const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session } = useAuth();
  const { track } = useAnalytics();

  // No additional tracking needed - only core events

  return <>{children}</>;
};

export default AnalyticsProvider;