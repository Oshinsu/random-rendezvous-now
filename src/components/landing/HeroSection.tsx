import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackCTAClick } from "@/utils/cmsTracking";
import { useDynamicContent } from "@/hooks/useDynamicContent";
import { EnhancedSearchButton } from "@/components/EnhancedSearchButton";
import { getOptimizedImageUrl } from "@/utils/imageOptimization";

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

  // Dynamic hero background - NO FALLBACK, DB is single source of truth
  const heroBackgroundImage = getOptimizedImageUrl(
    getContent('hero_background_image_url', ''),
    { width: 1920, quality: 85, format: 'webp' }
  );
  
  const brandName = getContent('hero_brand_name', 'Random');
  const heroTitle = i18n.language === 'fr' 
    ? getContent('hero_title', '1 clic. 1 groupe. 1 bar.') 
    : getContent('hero_title_en', '1 click. 1 group. 1 bar.');
  const heroSubtitle = getContent('hero_subtitle', 'Rencontrez de nouvelles personnes autour d\'un verre');
  const heroCta = getContent('hero_cta_button', 'Commencer l\'aventure');

  return (
    <section 
      className="relative py-12 sm:py-16 md:py-20 text-white animate-fade-in overflow-hidden min-h-[85vh] flex items-center" 
      style={{
        backgroundImage: `url(${heroBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/60 to-black/80"></div>
      
      <div className="relative container mx-auto px-4 sm:px-6 text-center z-10 h-full flex flex-col justify-center max-w-5xl">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="font-signature text-4xl sm:text-5xl md:text-6xl block mb-2 animate-scale-in bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent filter drop-shadow-[0_0_12px_rgba(241,194,50,0.3)]">
            {brandName}
          </span>
          <span className="text-neutral-100 font-display block animate-slide-in-up text-xl sm:text-2xl md:text-3xl">
            {heroTitle}
          </span>
        </h1>
        
        {heroSubtitle && (
          <p className="text-base sm:text-lg text-neutral-200 mb-6 max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            {heroSubtitle}
          </p>
        )}
        
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
