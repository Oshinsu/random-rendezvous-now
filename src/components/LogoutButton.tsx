import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';

const LogoutButton = () => {
  const { signOut, user, session } = useAuth();
  const { track } = useAnalytics();

  const handleLogout = async () => {
    // Track logout before signing out
    track('logout', {
      user_id: user?.id,
      session_duration: session ? Date.now() - new Date(session.expires_at || 0).getTime() : null,
      timestamp: new Date().toISOString()
    });

    await signOut();
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Se déconnecter
    </Button>
  );
};

export default LogoutButton;