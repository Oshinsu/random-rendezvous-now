import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackCTAClick } from "@/utils/cmsTracking";
import { useDynamicContent } from "@/hooks/useDynamicContent";
import { EnhancedSearchButton } from "@/components/EnhancedSearchButton";
import heroBackground from "@/assets/new-hero-banner.jpg";
import { Shuffle } from "lucide-react";

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
    ? getContent('hero_title', '1 clic. 5 inconnus. 1 bar.') 
    : getContent('hero_title_en', '1 click. 5 strangers. 1 bar.');
  const heroSubtitle = getContent('hero_subtitle', 'Le hasard forme ton groupe. Tu arrives. Tu vis.');

  return (
    <section 
      className="relative text-white animate-fade-in overflow-hidden min-h-[95vh] flex items-center"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay sombre + touche chaude */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/50 to-neutral-900/70"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      
      {/* Grain texture pour le chaos */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px'
      }}></div>

      {/* Éléments décoratifs chaotiques */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 bg-brand-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Trait diagonal décoratif */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-brand-500/10 to-transparent transform rotate-12 translate-x-32 hidden lg:block"></div>
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 text-center z-10 py-20 sm:py-28 flex flex-col justify-center max-w-5xl">
        
        {/* Badge Martinique */}
        <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-400/30 bg-black/30 backdrop-blur-sm text-brand-300 text-xs sm:text-sm font-medium tracking-wider">
            <span className="text-base">🌴</span>
            <span>Lancement en Martinique — Mars 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
          </div>
        </div>

        <h1 className="mb-6 sm:mb-8 tracking-tight leading-tight">
          <span className="font-signature text-6xl sm:text-7xl md:text-8xl block mb-3 animate-scale-in bg-gradient-to-r from-amber-200 via-brand-400 to-amber-500 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(241,194,50,0.4)]">
            {brandName}
          </span>
          <span className="text-white font-display font-extrabold block animate-slide-in-up text-2xl sm:text-3xl md:text-4xl lg:text-5xl drop-shadow-lg leading-snug">
            {heroTitle}
          </span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-white/80 mb-3 max-w-xl mx-auto animate-slide-in-up drop-shadow-md font-light tracking-wide" style={{ animationDelay: '0.2s' }}>
          {heroSubtitle}
        </p>

        {/* Trois stats chaotiques */}
        <div className="flex justify-center gap-6 sm:gap-10 mb-10 sm:mb-12 animate-slide-in-up" style={{ animationDelay: '0.25s' }}>
          {[
            { num: '1', label: 'clic' },
            { num: '5', label: 'inconnus' },
            { num: '?', label: 'bar tiré au sort' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="font-signature text-3xl sm:text-4xl text-brand-400 drop-shadow-lg">{stat.num}</div>
              <div className="text-white/50 text-xs uppercase tracking-widest mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center items-center mb-8 sm:mb-10 animate-slide-in-up" style={{ animationDelay: '0.35s' }}>
          <EnhancedSearchButton onSearch={handleMainAction} isSearching={false} isDisabled={false} />
        </div>

        {/* Mention "zéro algo" */}
        <div className="flex justify-center items-center gap-2 animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
          <Shuffle className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white/30 text-xs tracking-widest uppercase">Pas d'algorithme. Que du hasard.</span>
          <Shuffle className="w-3.5 h-3.5 text-white/30" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;