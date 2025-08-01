
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
import RandomLogo from "@/components/RandomLogo";

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
      <header className="p-3 sm:p-4 bg-white/90 backdrop-blur-sm border-b border-amber-200/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <RandomLogo size={32} className="sm:w-10 sm:h-10" />
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent tracking-tight">
              Random
            </span>
          </div>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-amber-700 font-medium text-sm hidden xs:block">Chargement...</p>
            </div>
          ) : user ? (
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="hidden md:flex items-center space-x-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">
                  {user.user_metadata?.first_name || user.email}
                </span>
              </div>
              <Button 
                onClick={handleGoToDashboard} 
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-4"
                size="sm"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Chercher un </span>Groupe
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="border-amber-300 text-amber-700 hover:bg-amber-50 transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-4"
                size="sm"
              >
                <span className="hidden xs:inline">Déconnexion</span>
                <span className="xs:hidden">✕</span>
              </Button>
            </div>
          ) : (
            <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-4" size="sm">
              <Link to="/auth">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Connexion</span>
                <span className="sm:hidden">⚡</span>
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
