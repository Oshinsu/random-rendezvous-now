
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyRandomSection from "@/components/landing/WhyRandomSection";
import NoMoreSection from "@/components/landing/NoMoreSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Star } from "lucide-react";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 min-h-screen flex flex-col">
      <header className="p-4 bg-white/90 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent tracking-tight">
              Random
            </span>
          </div>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-amber-700 font-medium">Chargement...</p>
            </div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">
                  Salut, {user.user_metadata?.first_name || user.email}
                </span>
              </div>
              <Button 
                onClick={handleGoToDashboard} 
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Mon Dashboard
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Se Déconnecter
              </Button>
            </div>
          ) : (
            <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg">
              <Link to="/auth">
                <Sparkles className="h-4 w-4 mr-2" />
                Se Connecter / S'inscrire
              </Link>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-grow">
        <HeroSection />
        <HowItWorksSection />
        <WhyRandomSection />
        <NoMoreSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
