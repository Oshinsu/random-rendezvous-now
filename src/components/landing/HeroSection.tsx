import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-banner.png";
import { trackCTAClick } from "@/utils/cmsTracking";
import { useDynamicContent } from "@/hooks/useDynamicContent";
import { DynamicText } from "@/components/dynamic/DynamicText";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { getContent } = useDynamicContent();

  const handleMainAction = () => {
    trackCTAClick('hero', user ? 'go_to_dashboard' : 'signup');
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section 
      className="relative py-12 sm:py-16 md:py-20 text-white animate-fade-in overflow-hidden min-h-[85vh] flex items-center" 
      style={{
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay gradient - Adapté pour dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-black/60 to-black/85 dark:from-red-900/20 dark:via-black/70 dark:to-black/90"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 text-center z-10 h-full flex flex-col justify-center max-w-5xl">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="font-signature text-5xl sm:text-6xl md:text-8xl block mb-2 animate-scale-in drop-shadow-glow-gold text-white dark:text-neutral-100">
            Random
          </span>
          <DynamicText
            contentKey={i18n.language === 'fr' ? 'hero_title' : 'hero_title_en'}
            fallback={i18n.language === 'fr' ? '1 clic. 1 groupe. 1 bar.' : '1 click. 1 group. 1 bar.'}
            as="span"
            className="gradient-text-animated text-shadow font-display block animate-slide-in-up text-2xl sm:text-4xl md:text-6xl"
          />
        </h1>
        
        <div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5 mb-8 sm:mb-10 animate-slide-in-up" 
          style={{ animationDelay: '0.6s' }}
        >
          <Button 
            onClick={handleMainAction} 
            size="lg" 
            className="magnetic-button bg-gradient-to-r from-amber-500 to-amber-600 dark:from-red-600 dark:to-red-700 hover:from-amber-600 hover:to-amber-700 dark:hover:from-red-700 dark:hover:to-red-800 text-white font-bold px-10 sm:px-12 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto max-w-xs sm:max-w-none transition-all duration-300 shadow-glow-strong animate-pulse-glow group rounded-2xl"
          >
            <Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
            {user 
              ? getContent('hero_cta_text_logged', 'Chercher un groupe')
              : getContent('hero_cta_text', "Tenter l'Aventure")
            }
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
