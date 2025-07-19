
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AmbianceSection from "@/components/landing/AmbianceSection";
import WhyRandomSection from "@/components/landing/WhyRandomSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CityAvailabilitySection from "@/components/landing/CityAvailabilitySection";
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
    <div className="bg-gradient-to-br from-white via-amber-50/30 to-orange-100/20 min-h-screen flex flex-col">
      <header className="p-4 bg-white/95 backdrop-blur-lg border-b border-amber-200/30 sticky top-0 z-50 shadow-soft">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <RandomLogo size={40} />
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-700 bg-clip-text text-transparent tracking-tight font-playfair">
              Random
            </span>
          </div>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-amber-700 font-medium text-sm">Chargement...</p>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-2xl border border-amber-200/50">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-800 font-medium">
                  {user.user_metadata?.first_name || user.email}
                </span>
              </div>
              <Button 
                onClick={handleGoToDashboard} 
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-medium transform hover:scale-105 transition-all duration-300"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Chercher un groupe
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="border-amber-300 text-amber-700 hover:bg-amber-50 transform hover:scale-105 transition-all duration-300"
                size="sm"
              >
                Déconnexion
              </Button>
            </div>
          ) : (
            <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-medium transform hover:scale-105 transition-all duration-300" size="sm">
              <Link to="/auth">
                <Sparkles className="h-4 w-4 mr-2" />
                Connexion
              </Link>
            </Button>
          )}
        </div>
      </header>
      <main className="flex-grow">
        <HeroSection />
        <AmbianceSection />
        <HowItWorksSection />
        <WhyRandomSection />
        <TestimonialsSection />
        <CityAvailabilitySection />
        <NoMoreSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
