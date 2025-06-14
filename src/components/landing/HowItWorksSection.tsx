
import { HandMetal, Users, MapPin, GlassWater } from "lucide-react";

const steps = [
  {
    icon: <HandMetal className="w-12 h-12 text-primary mb-4" />,
    title: "1. Appuie sur le bouton.",
    description: "Un seul clic. C'est tout. L'interface la plus minimaliste jamais conçue pour une app sociale.",
  },
  {
    icon: <Users className="w-12 h-12 text-primary mb-4" />,
    title: "2. Groupe formé.",
    description: "Notre algorithme te trouve 4 compagnons d'aventure. Totalement au hasard. Prépare-toi à l'inattendu.",
  },
  {
    icon: <MapPin className="w-12 h-12 text-primary mb-4" />,
    title: "3. Bar révélé.",
    description: "Le lieu de rendez-vous s'affiche APRÈS validation. 1€ par personne, et c'est parti pour l'aventure.",
  },
  {
    icon: <GlassWater className="w-12 h-12 text-primary mb-4" />,
    title: "4. Rencontre.",
    description: "L'inattendu t'attend. Zéro pression, 100% découverte. Le but ? Une vraie rencontre, une vraie discussion.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-4">
          Comment <span className="text-primary">Ça Marche</span> ?
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          Random, c'est la simplicité radicale. Pas de chichis, droit au but : la rencontre.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="bg-background p-6 rounded-lg shadow-lg text-center transition-transform hover:scale-105 animate-fade-in" style={{animationDelay: `${index * 150}ms`}}>
              <div className="flex justify-center items-center">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold mt-4 mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
