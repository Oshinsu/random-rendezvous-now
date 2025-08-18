
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const CtaSection = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

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
          {i18n.language === 'en' ? 'Ready for adventure?' : 'Prêt pour l\'aventure ?'}
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
          {i18n.language === 'en' ? 'Join Random today and transform your daily life' : 'Rejoignez Random dès aujourd\'hui et transformez votre quotidien'}
        </p>
        <Button 
          onClick={handleMainAction}
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 sm:px-10 py-3 sm:py-6 text-base sm:text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group w-full sm:w-auto max-w-xs sm:max-w-none"
        >
          <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
          {user ? (i18n.language === 'en' ? 'Go to Dashboard' : 'Aller au tableau de bord') : (i18n.language === 'en' ? 'Start now' : 'Commencer maintenant')}
        </Button>
        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
          Beta gratuite à Paris jusqu'au 1er septembre. Lyon arrive bientôt.
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
