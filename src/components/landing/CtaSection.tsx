
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CtaSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-4 sm:mb-6 animate-bounce" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-4 sm:mb-6">
          {i18n.language === 'en' ? (
            <>Ready for your <span className="text-primary gradient-text">next adventure</span>?</>
          ) : (
            <>Prêt pour ta <span className="text-primary gradient-text">prochaine aventure</span> ?</>
          )}
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
          {i18n.language === 'en' ? t('cta.subtitle') : 'Rejoins Random : 1 clic, 1 groupe, 1 bar. Des rencontres vraies près de toi.'}
        </p>
        <Button 
          onClick={handleMainAction}
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 sm:px-10 py-3 sm:py-6 text-base sm:text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group w-full sm:w-auto max-w-xs sm:max-w-none"
        >
          <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
          {user ? 
            (i18n.language === 'en' ? t('cta.button_logged') : 'Chercher un groupe') : 
            (i18n.language === 'en' ? t('cta.button') : 'Lancer Random')
          }
        </Button>
        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
          {i18n.language === 'en' ? t('cta.beta_info') : 'Beta gratuite à Paris jusqu\'au 1er septembre. Lyon arrive bientôt.'}
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
