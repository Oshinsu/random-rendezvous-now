
import { HandMetal, Users, MapPin, GlassWater } from "lucide-react";

const steps = [
  {
    icon: <HandMetal className="w-10 h-10 text-primary mb-4" />,
    title: "1. Un clic, c'est parti",
    description: "Interface ultra-minimaliste. Un bouton, une action. Fini les profils à remplir pendant des heures.",
  },
  {
    icon: <Users className="w-10 h-10 text-primary mb-4" />,
    title: "2. Groupe mystère formé",
    description: "4 inconnus, même envie d'aventure. Notre algo fait le reste. Prépare-toi à l'inattendu.",
  },
  {
    icon: <MapPin className="w-10 h-10 text-primary mb-4" />,
    title: "3. Destination révélée",
    description: "Le bar s'affiche une fois le groupe complet. Totalement gratuit pour découvrir l'expérience.",
  },
  {
    icon: <GlassWater className="w-10 h-10 text-primary mb-4" />,
    title: "4. L'aventure commence",
    description: "Rendez-vous dans 2h. Zéro pression, 100% authenticité. Laisse la magie opérer.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Comment <span className="text-primary">Ça Marche</span> ?
        </h2>
        <p className="text-base text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Random, c'est la simplicité radicale. Pas de blabla, direction l'action.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-background p-6 rounded-xl shadow-lg text-center transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in group" style={{animationDelay: `${index * 150}ms`}}>
              <div className="flex justify-center items-center group-hover:animate-bounce">
                {step.icon}
              </div>
              <h3 className="text-lg font-bold mt-4 mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
