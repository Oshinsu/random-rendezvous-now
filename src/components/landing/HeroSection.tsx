import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDynamicContent } from "@/hooks/useDynamicContent";
import { useState, useEffect } from "react";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { getContent } = useDynamicContent();
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const heroBannerUrl = getContent('hero_background_image', '/src/assets/new-hero-banner.jpg');
  
  return (
    <>
      <section 
        className="relative py-12 sm:py-16 md:py-20 text-white animate-fade-in overflow-hidden min-h-[85vh] flex items-center" 
        style={{
          backgroundImage: `url(${heroBannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Enhanced overlay for better contrast (WCAG AA) */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-5xl">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Social Proof Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-fade-in">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 border-2 border-white"></div>
              </div>
              <span className="text-sm font-medium text-white/90 hero-text-shadow">
                2,400+ sorties organisées
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight hero-text-shadow">
              {i18n.language === 'en' ? (
                <>
                  Meet new people <span className="font-signature text-5xl sm:text-6xl md:text-7xl lg:text-8xl gradient-text-animated block sm:inline">tonight</span>
                </>
              ) : (
                <>
                  Rencontre de nouvelles personnes <span className="font-signature text-5xl sm:text-6xl md:text-7xl lg:text-8xl gradient-text-animated block sm:inline">ce soir</span>
                </>
              )}
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl font-light max-w-3xl mx-auto leading-relaxed hero-text-shadow">
              {i18n.language === 'en' 
                ? t('hero.subtitle') 
                : '5 personnes, 1 lieu, des rencontres authentiques'}
            </p>
            
            <div className="pt-4">
              <Button 
                onClick={handleMainAction} 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-12 sm:px-16 py-6 sm:py-7 text-lg sm:text-xl transform transition-all duration-300 hover:scale-105 shadow-glow-strong group w-full sm:w-auto max-w-md sm:max-w-none rounded-2xl"
              >
                <Sparkles className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                {user 
                  ? (i18n.language === 'en' ? t('hero.button_logged') : 'Chercher un groupe')
                  : (i18n.language === 'en' ? t('hero.button') : 'Lancer Random')
                }
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky CTA for mobile (thumb zone optimized) */}
      {showStickyCTA && (
        <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden animate-slide-in-up">
          <Button 
            onClick={handleMainAction}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg shadow-glow-strong rounded-2xl"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {user 
              ? (i18n.language === 'en' ? 'Find a group' : 'Chercher un groupe')
              : (i18n.language === 'en' ? 'Start Random' : 'Lancer Random')
            }
          </Button>
        </div>
      )}
    </>
  );
};

export default HeroSection;
