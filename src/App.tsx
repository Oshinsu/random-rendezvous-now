
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GroupsPage from "./pages/GroupsPage";
import ProfilePage from "./pages/ProfilePage";
import UnifiedScheduledGroupsPage from "./pages/UnifiedScheduledGroupsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import { AdminApi } from "./pages/admin/AdminApi";
import { AdminRoute } from "./components/admin/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminGroups } from "./pages/admin/AdminGroups";
import { AdminMessages } from "./pages/admin/AdminMessages";
import AdminContent from "./pages/admin/AdminContent";
import { AdminAudit } from "./pages/admin/AdminAudit";
import { AdminActivity } from "./pages/admin/AdminActivity";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { AdminSettings } from "./pages/admin/AdminSettings";
import AdminBarOwners from "./pages/admin/AdminBarOwners";
// Lazy import to prevent circular dependency issues
import React from 'react';
const BarDashboard = React.lazy(() => import('./pages/BarDashboard'));
const BarApplicationPage = React.lazy(() => import('./pages/BarApplicationPage'));
const BarAuthPage = React.lazy(() => import('./pages/BarAuthPage'));
const SubscriptionPage = React.lazy(() => import('./pages/SubscriptionPage'));
import { BarOwnerRoute } from "./components/bar/BarOwnerRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AnalyticsProvider from "./components/AnalyticsProvider";
import { HelmetProvider } from "react-helmet-async";
import { SubscriptionNotifications } from "@/components/SubscriptionNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Composant pour les routes protégées
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

// Composant des routes qui utilise useAuth
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
    <Route path="/scheduled-groups" element={<ProtectedRoute><UnifiedScheduledGroupsPage /></ProtectedRoute>} />
    <Route path="/explore-by-city" element={<ProtectedRoute><UnifiedScheduledGroupsPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/subscription" element={<ProtectedRoute><React.Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}><SubscriptionPage /></React.Suspense></ProtectedRoute>} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/bar-dashboard" element={
      <ProtectedRoute>
        <BarOwnerRoute>
          <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <BarDashboard />
          </React.Suspense>
        </BarOwnerRoute>
      </ProtectedRoute>
    } />
    <Route path="/bar-application" element={
      <ProtectedRoute>
        <BarOwnerRoute>
          <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <BarApplicationPage />
          </React.Suspense>
        </BarOwnerRoute>
      </ProtectedRoute>
    } />
    <Route path="/bar-auth" element={
      <React.Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <BarAuthPage />
      </React.Suspense>
    } />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/auth/v1/callback" element={<AuthCallbackPage />} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/users" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminUsers />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/groups" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminGroups />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/messages" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminMessages />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/content" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminContent />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/bar-owners" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminBarOwners />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/audit" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminAudit />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/activity" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminActivity />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/logs" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminLogs />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/api" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminApi />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    <Route path="/admin/settings" element={
      <ProtectedRoute>
        <AdminRoute>
          <AdminLayout>
            <AdminSettings />
          </AdminLayout>
        </AdminRoute>
      </ProtectedRoute>
    } />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsProvider>
          <HelmetProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Toaster />
                <Sonner />
                <SubscriptionNotifications />
                <AppRoutes />
              </div>
            </TooltipProvider>
          </HelmetProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
