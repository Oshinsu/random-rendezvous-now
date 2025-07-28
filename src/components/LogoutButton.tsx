import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
// Removed analytics - only core business events needed

const LogoutButton = () => {
  const { signOut } = useAuth();

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