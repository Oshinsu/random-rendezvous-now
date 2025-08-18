
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroBanner from "@/assets/new-hero-banner.jpg";

const HeroSection = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
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
          {i18n.language === 'en' ? 'Discover the unexpected' : 'Découvrez l\'inattendu'}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
          {i18n.language === 'en' ? 'Join spontaneous groups and create unforgettable memories' : 'Rejoignez des groupes spontanés et créez des souvenirs inoubliables'}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button 
            onClick={handleMainAction}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-auto max-w-xs sm:max-w-none transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group"
          >
            <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
            {user ? (i18n.language === 'en' ? 'Go to Dashboard' : 'Aller au tableau de bord') : (i18n.language === 'en' ? 'Start the adventure' : 'Commencer l\'aventure')}
          </Button>
        </div>
        <div className="max-w-2xl mx-auto px-2">
          <p className="text-xs sm:text-sm text-white/80 mb-3 sm:mb-4">
            {i18n.language === 'en' ? 'Trusted by 1000+ urban adventurers' : 'Adopté par plus de 1000+ aventuriers urbains'}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="whitespace-nowrap">Beta en août</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="whitespace-nowrap">Bars sélectionnés au hasard</span>
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="whitespace-nowrap text-center">Gratuit pendant les vacances</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
