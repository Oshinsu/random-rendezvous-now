
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
    <div className="bg-background min-h-screen flex flex-col">
      <header className="p-4 bg-secondary border-b border-border">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Random</h1>
          {loading ? (
            <p>Chargement...</p>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Salut, {user.user_metadata?.first_name || user.email}
              </span>
              <Button onClick={handleGoToDashboard} variant="default">
                Mon Dashboard
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                Se Déconnecter
              </Button>
            </div>
          ) : (
            <Button asChild>
              <Link to="/auth">Se Connecter / S'inscrire</Link>
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
