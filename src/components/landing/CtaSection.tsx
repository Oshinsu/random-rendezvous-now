
import { Button } from "@/components/ui/button";
import { Rocket, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const CtaSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Rocket className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-6 animate-bounce" />
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            {i18n.language === 'en' ? (
              <>Ready to <span className="text-primary">meet</span>?</>
            ) : (
              <>Prêt à faire des <span className="text-primary">rencontres</span> ?</>
            )}
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto">
            {i18n.language === 'en' 
              ? 'Join Random today and start making authentic connections in Paris.'
              : 'Rejoins Random aujourd\'hui et commence à créer des connexions authentiques à Paris.'
            }
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button 
              onClick={handleMainAction}
              size="lg"
              className="text-lg px-8 sm:px-12 py-4 sm:py-6 shadow-2xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-110 group"
            >
              <Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-pulse" />
              {user ? 
                (i18n.language === 'en' ? t('cta.button_logged') : 'Chercher un groupe maintenant') : 
                (i18n.language === 'en' ? t('cta.button') : 'Commencer l\'aventure')
              }
            </Button>
          </motion.div>

          <p className="text-sm text-muted-foreground mt-6">
            {user ? 
              "🎲" : 
              (i18n.language === 'en' ? `✨ ${t('cta.beta_info')}` : "✨ C'est gratuit pendant la beta")
            }
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
