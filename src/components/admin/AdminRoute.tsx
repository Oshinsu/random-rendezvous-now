import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    // ✅ OPTIMISATION: Log admin check failures
    console.log('🔒 Admin access denied, redirecting to dashboard', {
      timestamp: new Date().toISOString(),
      path: window.location.pathname
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};