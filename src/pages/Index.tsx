
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyRandomSection from "@/components/landing/WhyRandomSection";
import NoMoreSection from "@/components/landing/NoMoreSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Ajout de useAuth
import { Button } from "@/components/ui/button"; // Ajout de Button
import { Link, useNavigate } from "react-router-dom"; // Ajout de Link et useNavigate

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   // Ensure dark mode is applied by default to the html tag if not using system preference
  //   // document.documentElement.classList.add('dark'); // if your tailwind.config.ts darkMode is 'class'
  //   // Or, if your CSS variables in :root are already for dark mode, this might not be needed.
  //   // My index.css sets dark theme variables directly in :root, so this should be fine.
  // }, []);

  const handleSignOut = async () => {
    await signOut();
    // La navigation est gérée dans AuthContext après la déconnexion
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <header className="p-4 bg-secondary border-b border-border">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Random App</h1>
          {loading ? (
            <p>Chargement...</p>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Bonjour, {user.email}</span>
              <Button onClick={handleSignOut} variant="outline">Se Déconnecter</Button>
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
