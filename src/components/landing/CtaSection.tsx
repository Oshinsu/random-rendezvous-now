
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-6 text-center">
        <Rocket className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
          Prêt à <span className="text-primary">Réinventer</span> Vos Soirées ?
        </h2>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          L'aventure Random commence bientôt. Soyez parmi les premiers à briser la routine.
        </p>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-xl">
          Rejoindre la Liste d'Attente
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          (Promis, pas de spam, juste l'annonce du lancement et peut-être une surprise... aléatoire, évidemment.)
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
