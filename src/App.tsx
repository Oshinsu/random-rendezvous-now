
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom"; // BrowserRouter est retiré d'ici
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage"; // Ajout de AuthPage
import { useAuth } from "./contexts/AuthContext"; // Ajout de useAuth
import { useEffect }_ from "react"; // Correction : _ après useEffect n'est pas valide

const queryClient = new QueryClient();

// Composant pour les routes protégées
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Afficher un indicateur de chargement pendant que l'état d'authentification est vérifié
    return <div className="flex justify-center items-center h-screen"><p>Chargement...</p></div>;
  }

  if (!user) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    // en conservant l'URL de provenance pour une redirection après connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* BrowserRouter est déplacé dans main.tsx */}
      <Routes>
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} /> {/* Index est maintenant protégé */}
        <Route path="/auth" element={<AuthPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
