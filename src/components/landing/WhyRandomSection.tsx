
import { Sparkles, ShieldCheck, ThumbsUp, Zap } from "lucide-react";

const benefits = [
  {
    icon: <Sparkles className="w-8 h-8 text-primary" />,
    title: "100% Vrai",
    description: "Pas de filtres, pas de mensonges. Tu te montres comme tu es, les autres aussi.",
  },
  {
    icon: <Zap className="w-8 h-8 text-primary" />,
    title: "La Magie du Hasard",
    description: "Chaque soirée est une surprise. Tu ne sais jamais qui tu vas rencontrer.",
  },
  {
    icon: <ThumbsUp className="w-8 h-8 text-primary" />,
    title: "Super Simple",
    description: "Un clic et c'est parti. Moins de temps sur ton téléphone, plus de vrais moments.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-primary" />,
    title: "Gratuit & Sûr",
    description: "Découvre l'expérience gratuitement. Bars sélectionnés, ta sécurité avant tout.",
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
          Parce qu'on en a marre des soirées ennuyeuses et des connexions bidons.
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
