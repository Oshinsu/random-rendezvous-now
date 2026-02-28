import { Button } from "@/components/ui/button";
import { Dices, Shuffle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackCTAClick, trackConversion } from "@/utils/cmsTracking";
import { useDynamicContent } from "@/hooks/useDynamicContent";

const CtaSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { getContent } = useDynamicContent();

  const handleMainAction = () => {
    trackCTAClick('cta', user ? 'go_to_dashboard' : 'launch_random');
    if (user) {
      trackConversion('cta');
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const ctaTitle = getContent('cta_title', 'Prêt à jouer le jeu ?');

  return (
    <section className="py-16 sm:py-20 md:py-28 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 30%, #1a0f00 60%, #0f0a00 100%)'
    }}>
      {/* Fond doré lumineux derrière le CTA */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Texture grain */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(241,194,50,0.8) 1px, transparent 0)',
        backgroundSize: '28px 28px'
      }}></div>

      {/* Lignes diagonales décoratives */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-px bg-brand-400 transform -rotate-6 translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-full h-px bg-brand-400 transform -rotate-6 -translate-y-20"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-3xl">
        {/* Dés animés */}
        <div className="flex justify-center mb-6 sm:mb-8 animate-float">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
            <Dices className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold mb-5 sm:mb-6 animate-slide-in-up text-white leading-tight">
          <span className="font-signature text-4xl sm:text-5xl md:text-6xl bg-gradient-to-r from-brand-300 via-brand-400 to-brand-500 bg-clip-text text-transparent block mb-2">
            {ctaTitle}
          </span>
        </h2>

        <p className="text-base sm:text-lg text-white/60 mb-4 sm:mb-6 max-w-2xl mx-auto leading-relaxed animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          {getContent('cta_subtitle', '1 clic. 5 inconnus. 1 bar. C\'est tout. Pas d\'algo, pas de filtre — juste le hasard et toi.')}
        </p>

        {/* Badge lancement */}
        <div className="flex justify-center mb-8 sm:mb-10 animate-slide-in-up" style={{ animationDelay: '0.15s' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-medium tracking-wide">
            <span>🌴</span>
            {getContent('cta_beta_info', 'Bêta gratuite · Martinique · Mars 2026')}
          </span>
        </div>

        <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <Button 
            onClick={handleMainAction} 
            size="lg" 
            className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white font-bold px-10 sm:px-14 py-5 sm:py-6 text-base sm:text-lg transform hover:-translate-y-1 transition-all duration-300 shadow-glow-strong group w-full sm:w-auto rounded-2xl border-0"
          >
            <Shuffle className="mr-2.5 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            {user 
              ? getContent('cta_button_text_logged', 'Trouver un groupe')
              : getContent('cta_button_text', 'Tenter l\'Aventure')
            }
          </Button>
        </div>

        {/* Mention zéro algo */}
        <p className="mt-5 text-white/25 text-xs tracking-widest uppercase animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          Aucun algorithme. Que du hasard.
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
