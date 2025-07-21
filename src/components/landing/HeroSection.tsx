
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="py-16 md:py-24 bg-background text-foreground animate-fade-in">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-extrabold mb-6 tracking-tight">
          Random: <span className="text-primary">1 Clic = 1 Groupe = 1 Bar</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Dis <span className="font-semibold text-foreground">"oui"</span> à l'inattendu. 
          <span className="font-semibold text-foreground"> C'est pas un date. C'est un dé.</span>
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
          <Button 
            onClick={handleMainAction}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 text-base w-full sm:w-auto transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
            {user ? 'Chercher un groupe' : 'Tenter l\'Aventure'}
          </Button>
        </div>
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            {user ? '🎲 Votre prochaine aventure Random vous attend' : '✨ Rejoignez déjà +500 aventuriers'}
          </p>
          <div className="flex justify-center items-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Groupes actifs
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Bars partenaires
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Partout en France
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
