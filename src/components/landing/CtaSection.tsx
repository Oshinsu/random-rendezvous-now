import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const CtaSection = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    t,
    i18n
  } = useTranslation();
  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  return <section className="py-16 sm:py-20 md:py-32 bg-gradient-to-br from-white via-brand-50/20 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl animate-pulse" style={{
      animationDelay: '1s'
    }}></div>
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-4xl">
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow mx-auto mb-6 sm:mb-8 animate-float">
          <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold mb-6 sm:mb-8 animate-slide-in-up">
          {i18n.language === 'en' ? <>Ready for your <span className="font-signature text-4xl sm:text-5xl md:text-6xl gradient-text-animated block sm:inline">next adventure</span>?</> : <>Prêt pour ta <span className="font-signature text-4xl sm:text-5xl md:text-6xl gradient-text-animated block sm:inline">prochaine aventure</span> ?</>}
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-in-up" style={{
        animationDelay: '0.1s'
      }}>
          {i18n.language === 'en' ? t('cta.subtitle') : 'Rejoins Random : 1 clic, 1 groupe, 1 bar. Des rencontres vraies près de toi.'}
        </p>
        <div className="animate-slide-in-up" style={{
        animationDelay: '0.2s'
      }}>
          <Button onClick={handleMainAction} size="lg" className="magnetic-button bg-primary hover:bg-primary text-primary-foreground font-bold px-12 sm:px-16 py-6 sm:py-7 text-lg sm:text-xl transform transition-all duration-300 shadow-glow-strong animate-pulse-glow group w-full sm:w-auto max-w-md sm:max-w-none rounded-2xl">
            <Rocket className="mr-3 h-6 w-6 sm:h-7 sm:w-7 group-hover:animate-pulse" />
            {user ? i18n.language === 'en' ? t('cta.button_logged') : 'Chercher un groupe' : i18n.language === 'en' ? t('cta.button') : 'Lancer Random'}
          </Button>
        </div>
        
      </div>
    </section>;
};
export default CtaSection;