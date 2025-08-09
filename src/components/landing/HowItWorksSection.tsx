
import React from "react";
import { HandMetal, Users, MapPin, GlassWater } from "lucide-react";

const steps = [
  {
    icon: <HandMetal className="w-10 h-10 text-primary mb-4" />,
    title: "1. Clique",
    description: "Un bouton et c'est parti. Zéro profil, zéro friction.",
  },
  {
    icon: <Users className="w-10 h-10 text-primary mb-4" />,
    title: "2. Ton groupe se forme",
    description: "5 personnes, toi compris, prêtes pour une vraie rencontre. Attente médiane ~7 min.",
  },
  {
    icon: <MapPin className="w-10 h-10 text-primary mb-4" />,
    title: "3. On dévoile le bar",
    description: "Un lieu ouvert, proche et validé par Random.",
  },
  {
    icon: <GlassWater className="w-10 h-10 text-primary mb-4" />,
    title: "4. Rendez-vous",
    description: "Dans 1 heure. Juste assez de temps pour te préparer.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          Comment <span className="text-primary">Ça Marche</span> ?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          Simple comme bonjour. Direct et efficace !
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-background p-4 sm:p-6 rounded-xl shadow-lg text-center transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in group" style={{animationDelay: `${index * 150}ms`}}>
              <div className="flex justify-center items-center group-hover:animate-bounce">
                {React.cloneElement(step.icon, { className: "w-8 h-8 sm:w-10 sm:h-10 text-primary mb-3 sm:mb-4" })}
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-3 sm:mt-4 mb-2 sm:mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
