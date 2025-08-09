
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { pushEvent } from "@/utils/marketingAnalytics";
import heroBanner from "@/assets/new-hero-banner.jpg";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    pushEvent('view_random_hour');
  }, []);

  const handleMainAction = () => {
    pushEvent('cta_hero_click', { logged_in: !!user });
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  return (
    <section id="hero" 
      className="relative py-6 sm:py-8 md:py-12 text-white animate-fade-in overflow-hidden min-h-[50vh] sm:min-h-[60vh] max-h-[450px] sm:max-h-[500px]"
      style={{
        backgroundImage: `url(${heroBanner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 text-center z-10 h-full flex flex-col justify-center">
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-heading font-extrabold mb-4 sm:mb-6 tracking-tight leading-tight">
          Random • <span className="text-primary block sm:inline">1 clic. 5 inconnus. 1 bar.</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
          Beta gratuite à Paris jusqu'au 30 sept. Rejoins un groupe de 5 près de toi en &lt; 10 min, dans un bar public. 100 % non-dating.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button 
            onClick={handleMainAction}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto max-w-xs sm:max-w-none transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
            {user ? 'Chercher un groupe' : 'Lancer Random maintenant'}
          </Button>
          <Button asChild variant="outline" size="lg" className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto max-w-xs sm:max-w-none">
            <a href="#how-it-works" onClick={() => pushEvent('cta_hero_secondary_click')}>Voir comment ça marche</a>
          </Button>
        </div>
        <div className="max-w-2xl mx-auto px-2">
          <p className="text-xs sm:text-sm text-white/90 mb-3 sm:mb-4">
            Groupes formés ce soir : 12 • Attente médiane : 7 min
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-white/90">
            <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">18+</span>
            <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">Groupe de 5</span>
            <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">Bars publics</span>
            <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">Signalement 1‑tap</span>
            <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">Random Hour 19h30–22h</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
