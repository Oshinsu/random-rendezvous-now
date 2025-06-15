
import { Sparkles, ShieldCheck, ThumbsUp, Zap } from "lucide-react";

const benefits = [
  {
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "100% Authentique",
    description: "Fini les filtres et les profils bidons. Ici, on se montre tel qu'on est. L'authenticité, c'est notre kiff.",
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "L'Adrénaline de l'Inconnu",
    description: "Redécouvre le frisson de la surprise. Chaque soirée Random est une page blanche à écrire ensemble.",
  },
  {
    icon: <ThumbsUp className="w-8 h-8 text-primary" />,
    title: "Simple comme Bonjour",
    description: "Une app, un bouton, une aventure. Moins de temps sur ton écran, plus de moments IRL qui comptent.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Gratuit & Fiable",
    description: "Expérience 100% gratuite pour commencer. Bars partenaires sélectionnés. Ta sécurité, notre priorité absolue.",
  },
];

const WhyRandomSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Pourquoi <span className="text-primary">Random</span> Change Tout ?
        </h2>
        <p className="text-base text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Parce qu'on en a marre des soirées prévisibles et des connexions superficielles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-4 p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-neutral-200/50 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in group" style={{animationDelay: `${index * 150}ms`}}>
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
