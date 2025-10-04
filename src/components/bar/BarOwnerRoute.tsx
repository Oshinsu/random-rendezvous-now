import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBarOwner } from '@/hooks/useBarOwner';
import { Skeleton } from '@/components/ui/skeleton';

interface BarOwnerRouteProps {
  children: ReactNode;
}

export function BarOwnerRoute({ children }: BarOwnerRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { barOwner, isLoadingProfile } = useBarOwner();
  const navigate = useNavigate();

  if (authLoading || isLoadingProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center space-y-4">
          <Skeleton className="w-8 h-8 rounded-full mx-auto" />
          <p>Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Allow access to application form if no bar owner profile exists
  if (!barOwner) {
    return <>{children}</>;
  }

  // Allow access if approved bar owner
  if (barOwner.status === 'approved') {
    return <>{children}</>;
  }

  // For pending/rejected status, still show the page (it will handle the display)
  return <>{children}</>;
}