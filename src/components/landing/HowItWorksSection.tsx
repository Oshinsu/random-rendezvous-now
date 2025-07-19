
import { HandMetal, Users, MapPin, GlassWater } from "lucide-react";

const steps = [
  {
    icon: <HandMetal className="w-12 h-12 text-amber-600 mb-4" />,
    title: "1. Un clic, c'est parti",
    description: "Interface ultra-minimaliste. Un bouton, une action. Fini les profils à remplir pendant des heures.",
  },
  {
    icon: <Users className="w-12 h-12 text-orange-600 mb-4" />,
    title: "2. Groupe mystère formé",
    description: "4 inconnus, même envie d'aventure. Notre algo fait le reste. Prépare-toi à l'inattendu.",
  },
  {
    icon: <MapPin className="w-12 h-12 text-amber-700 mb-4" />,
    title: "3. Destination révélée",
    description: "Le bar s'affiche une fois le groupe complet. Totalement gratuit pour découvrir l'expérience.",
  },
  {
    icon: <GlassWater className="w-12 h-12 text-orange-700 mb-4" />,
    title: "4. L'aventure commence",
    description: "Rendez-vous dans 2h. Zéro pression, 100% authenticité. Laisse la magie opérer.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-neutral-50 to-amber-50/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            Comment <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Ça Marche</span> ?
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Random, c'est la simplicité radicale. Pas de blabla, direction l'action.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft hover:shadow-strong border border-amber-100/50 hover:border-amber-200/70 text-center transition-all duration-500 hover:scale-105 group" style={{animationDelay: `${index * 150}ms`}}>
              
              {/* Step number background */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm group-hover:from-amber-200 group-hover:to-orange-200 transition-all duration-300">
                {index + 1}
              </div>

              {/* Icon */}
              <div className="flex justify-center items-center group-hover:animate-bounce mb-6">
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-4 text-neutral-800 group-hover:text-amber-700 transition-colors duration-300">{step.title}</h3>
              <p className="text-neutral-600 leading-relaxed">{step.description}</p>

              {/* Connecting line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-amber-300 to-orange-300 opacity-50"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-3xl border border-amber-200/30">
          <p className="text-lg text-neutral-700 font-medium mb-2">
            Prêt à vivre l'expérience Random ?
          </p>
          <p className="text-neutral-500">
            Il suffit d'un clic pour transformer votre soirée ordinaire en aventure extraordinaire.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
