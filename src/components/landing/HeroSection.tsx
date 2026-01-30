import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackCTAClick } from "@/utils/cmsTracking";
import { useDynamicContent } from "@/hooks/useDynamicContent";
import { EnhancedSearchButton } from "@/components/EnhancedSearchButton";
import heroBackground from "@/assets/hero-background.jpg";

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

  const brandName = getContent('hero_brand_name', 'Random');
  const heroTitle = i18n.language === 'fr' 
    ? getContent('hero_title', '1 clic. 1 groupe. 1 bar.') 
    : getContent('hero_title_en', '1 click. 1 group. 1 bar.');
  const heroSubtitle = getContent('hero_subtitle', 'Rencontrez de nouvelles personnes autour d\'un verre');

  return (
    <section 
      className="relative py-16 sm:py-20 md:py-28 text-white animate-fade-in overflow-hidden min-h-[90vh] flex items-center"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay gradient élégant blanc/or */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-amber-900/30"></div>
      
      {/* Particules dorées décoratives */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 text-center z-10 h-full flex flex-col justify-center max-w-5xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="font-signature text-5xl sm:text-6xl md:text-7xl block mb-4 animate-scale-in bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(241,194,50,0.5)]">
            {brandName}
          </span>
          <span className="text-white font-display block animate-slide-in-up text-2xl sm:text-3xl md:text-4xl drop-shadow-lg">
            {heroTitle}
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto animate-slide-in-up drop-shadow-md" style={{ animationDelay: '0.2s' }}>
          {heroSubtitle}
        </p>
        
        <div className="flex justify-center items-center mb-8 sm:mb-10 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <EnhancedSearchButton onSearch={handleMainAction} isSearching={false} isDisabled={false} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;