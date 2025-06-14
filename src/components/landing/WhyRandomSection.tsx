
import { Sparkles, ShieldCheck, ThumbsUp, Zap } from "lucide-react";

const benefits = [
  {
    icon: <Sparkles className="w-10 h-10 text-primary" />,
    title: "L'Authenticité Brut",
    description: "Pas de filtres, pas de masques, pas de profils léchés. Juste des humains, prêts à connecter.",
  },
  {
    icon: <Zap className="w-10 h-10 text-primary" />,
    title: "Le Frisson de l'Inconnu",
    description: "Redécouvre le plaisir de la surprise. Chaque rencontre est une nouvelle page blanche.",
  },
  {
    icon: <ThumbsUp className="w-10 h-10 text-primary" />,
    title: "Simplicité Radicale",
    description: "Une app, un bouton. On a dit minimaliste ? On l'a fait. Moins de temps sur ton écran, plus dans la vraie vie.",
  },
  {
    icon: <ShieldCheck className="w-10 h-10 text-primary" />,
    title: "Sécurité & Confiance",
    description: "Paiement sécurisé de 1€ pour engager. Bientôt, des bars partenaires premium pour des expériences au top.",
  },
];

const WhyRandomSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-12 md:mb-16">
          Pourquoi <span className="text-primary">Random</span> Va Te Changer La Vie ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
