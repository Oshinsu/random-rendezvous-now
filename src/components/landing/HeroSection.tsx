import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDynamicContent } from "@/hooks/useDynamicContent";
import { OptimizedImage } from "@/components/OptimizedImage";
const HeroSection = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    t,
    i18n
  } = useTranslation();
  const {
    getContent
  } = useDynamicContent();
  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  const heroBannerUrl = getContent('hero_background_image', '/src/assets/new-hero-banner.jpg');
  
  return <section className="relative py-12 sm:py-16 md:py-20 text-white animate-fade-in overflow-hidden min-h-[85vh] flex items-center bg-[#2C1810]">
      {/* Hero image with priority loading */}
      <OptimizedImage
        src={heroBannerUrl}
        alt="Random hero banner"
        className="absolute inset-0 w-full h-full object-cover"
        priority={true}
      />
      
      {/* Overlay gradient dynamique */}
      <div className="absolute inset-0" style={{
      background: 'linear-gradient(135deg, rgba(241, 194, 50, 0.15) 0%, rgba(0, 0, 0, 0.65) 50%, rgba(241, 194, 50, 0.1) 100%)'
    }}></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 text-center z-10 h-full flex flex-col justify-center max-w-5xl">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 tracking-tight leading-tight">
          {i18n.language === 'en' ? <>
              <span className="font-signature text-5xl sm:text-6xl md:text-8xl block mb-2 animate-scale-in drop-shadow-glow-gold">Random</span>
              <span className="gradient-text-animated text-shadow font-display block animate-slide-in-up" style={{
            animationDelay: '0.2s'
          }}>
                One click. 5 strangers. 1 bar.
              </span>
            </> : <>
              <span className="font-signature text-5xl sm:text-6xl md:text-8xl block mb-2 animate-scale-in drop-shadow-glow-gold">Random</span>
              <span className="gradient-text-animated text-shadow font-display block animate-slide-in-up" style={{
            animationDelay: '0.2s'
          }}>
                1 clic. 5 inconnus. 1 bar.
              </span>
            </>}
        </h1>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-5 mb-8 sm:mb-10 animate-slide-in-up" style={{
        animationDelay: '0.6s'
      }}>
          <Button onClick={handleMainAction} size="lg" className="magnetic-button bg-primary hover:bg-primary text-primary-foreground font-bold px-10 sm:px-12 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto max-w-xs sm:max-w-none transition-all duration-300 shadow-glow-strong animate-pulse-glow group rounded-2xl">
            <Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
            {user ? i18n.language === 'en' ? t('hero.cta_logged') : 'Chercher un groupe' : i18n.language === 'en' ? t('hero.cta') : 'Tenter l\'Aventure'}
          </Button>
        </div>
        {!user}
        
        
        
      </div>
    </section>;
};
export default HeroSection;