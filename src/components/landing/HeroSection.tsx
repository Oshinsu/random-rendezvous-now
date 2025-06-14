
import { Button } from "@/components/ui/button";
import { Download, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="py-20 md:py-32 bg-background text-foreground animate-fade-in">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-heading font-extrabold mb-6">
          Random: <span className="text-primary">Lance les Dés</span> de Ta Soirée.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
          Fatigué des swipes sans fin et des profils bidons ? Random te jette à l'eau.
          Des groupes de 5, au pif, dans un bar près de toi. L'anti-app de rencontre. Juste du hasard, de vraies rencontres.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button 
            onClick={handleMainAction}
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg w-full sm:w-auto"
          >
            <Zap className="mr-2 h-5 w-5" />
            {user ? 'Aller au Dashboard' : 'Commencer l\'Aventure'}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-primary-foreground border-primary hover:bg-primary/10 font-semibold px-8 py-6 text-lg w-full sm:w-auto"
          >
             <Download className="mr-2 h-5 w-5" /> 
             {user ? 'Inviter des Amis' : 'Rejoindre la Révolution'}
          </Button>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          {user ? 'Prêt pour votre prochaine aventure Random ?' : 'Créez votre compte et lancez-vous !'}
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
