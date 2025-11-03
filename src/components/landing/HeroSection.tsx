import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-banner.png";
import { trackCTAClick } from "@/utils/cmsTracking";
import { useDynamicContent } from "@/hooks/useDynamicContent";
import { DynamicText } from "@/components/dynamic/DynamicText";
import { EnhancedSearchButton } from "@/components/EnhancedSearchButton";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { getContent } = useDynamicContent();

  const handleMainAction = async () => {
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
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-black/60 to-black/85"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 text-center z-10 h-full flex flex-col justify-center max-w-5xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="font-signature text-4xl sm:text-5xl md:text-6xl block mb-2 animate-scale-in text-white filter drop-shadow-[0_0_20px_rgba(241,194,50,0.5)]">
            Random
          </span>
          <DynamicText
            contentKey={i18n.language === 'fr' ? 'hero_title' : 'hero_title_en'}
            fallback={i18n.language === 'fr' ? '1 clic. 1 groupe. 1 bar.' : '1 click. 1 group. 1 bar.'}
            as="span"
            className="bg-gradient-to-r from-brand-400 via-brand-300 to-brand-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-text font-display block animate-slide-in-up text-xl sm:text-2xl md:text-3xl"
          />
        </h1>
        
        <div 
          className="flex justify-center items-center mb-8 sm:mb-10 animate-slide-in-up" 
          style={{ animationDelay: '0.3s' }}
        >
          <EnhancedSearchButton 
            onSearch={handleMainAction}
            isSearching={false}
            isDisabled={false}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
