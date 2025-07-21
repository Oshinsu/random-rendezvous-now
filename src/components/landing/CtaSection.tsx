
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const CtaSection = () => {
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
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-6 text-center">
        <Rocket className="w-12 h-12 text-primary mx-auto mb-6 animate-bounce" />
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
          Prêt à <span className="text-primary gradient-text">Tenter l'Aventure</span> ?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Rejoins Random. Ceux qui ont testé ne regrettent jamais.
        </p>
        <Button 
          onClick={handleMainAction}
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group"
        >
          <Rocket className="mr-2 h-5 w-5 group-hover:animate-pulse" />
          {user ? 'Chercher un groupe' : 'Rejoindre l\'Aventure'}
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          Gratuit et sans prise de tête. Juste l'envie de vivre quelque chose de cool.
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
