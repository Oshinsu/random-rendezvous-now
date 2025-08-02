import React from 'react';
import { Button } from '@/components/ui/button';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';

const LogoutButton = () => {
  const { signOut } = useEnhancedAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Button onClick={handleLogout} variant="outline">
      Se déconnecter
    </Button>
  );
};

export default LogoutButton;