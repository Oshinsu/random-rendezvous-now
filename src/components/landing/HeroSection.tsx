
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

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
    <section 
      className="relative py-16 md:py-24 text-white animate-fade-in overflow-hidden"
      style={{
        backgroundImage: `url(${heroBanner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        aspectRatio: '2/1'
      }}
    >
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative container mx-auto px-6 text-center z-10">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-extrabold mb-6 tracking-tight">
          Random: <span className="text-primary">1 Clic = 1 Groupe = 1 Bar</span>
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
          Dis <span className="font-semibold text-white">"oui"</span> à l'aventure ! 
          <span className="font-semibold text-white"> Rencontre 4 personnes géniales autour d'un verre.</span>
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
          <p className="text-sm text-white/80 mb-4">
            {user ? '🎲 Ta prochaine aventure Random t\'attend !' : '✨ Beta gratuite - Paris : 1er août au 1er septembre'}
          </p>
          <div className="flex justify-center items-center gap-6 text-xs text-white/70">
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
              Paris puis Lyon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
