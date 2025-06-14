
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-6 text-center">
        <Rocket className="w-12 h-12 text-primary mx-auto mb-6 animate-bounce" />
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
          Prêt à <span className="text-primary gradient-text">Révolutionner</span> Tes Soirées ?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Rejoins l'aventure Random. Les premiers à tenter l'expérience ne le regrettent jamais.
        </p>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group">
          <Rocket className="mr-2 h-5 w-5 group-hover:animate-pulse" />
          Rejoindre l'Aventure
        </Button>
        <p className="mt-6 text-sm text-muted-foreground">
          Promis, on ne spam pas. Juste l'annonce du lancement et quelques surprises... aléatoires, évidemment.
        </p>
      </div>
    </section>
  );
};

export default CtaSection;
