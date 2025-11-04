import React from "react";
import * as LucideIcons from "lucide-react";
import { useDynamicContent } from '@/hooks/useDynamicContent';

const HowItWorksSection = () => {
  const { getContent } = useDynamicContent();

  // Helper pour obtenir une icône Lucide dynamiquement
  const getDynamicIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
      return <LucideIcons.HelpCircle className="w-10 h-10 text-primary mb-4" />;
    }
    return <IconComponent className="w-10 h-10 text-primary mb-4" />;
  };

  const steps = [
    {
      icon: getDynamicIcon(getContent('how_it_works_step_1_icon', 'HandMetal')),
      title: getContent('how_it_works_step_1_title', 'Tu cliques'),
      description: getContent('how_it_works_step_1_description', "Un simple clic et Random s'occupe de tout."),
    },
    {
      icon: getDynamicIcon(getContent('how_it_works_step_2_icon', 'Users')),
      title: getContent('how_it_works_step_2_title', 'On matche un groupe'),
      description: getContent('how_it_works_step_2_description', 'Notre algorithme crée un groupe équilibré de 4-5 personnes.'),
    },
    {
      icon: getDynamicIcon(getContent('how_it_works_step_3_icon', 'MapPin')),
      title: getContent('how_it_works_step_3_title', 'On trouve le bar parfait'),
      description: getContent('how_it_works_step_3_description', 'Random sélectionne un bar cool, équidistant de tous.'),
    },
    {
      icon: getDynamicIcon(getContent('how_it_works_step_4_icon', 'GlassWater')),
      title: getContent('how_it_works_step_4_title', 'Tu profites'),
      description: getContent('how_it_works_step_4_description', 'Rendez-vous au bar et vis une soirée authentique.'),
    },
  ];

  const sectionTitle = getContent('how_it_works_main_title_new', 'Comment ça marche ?');
  const sectionSubtitle = getContent('how_it_works_subtitle_new', 'Rejoindre Random est simple comme bonjour');

  return (
    <section className="py-16 sm:py-20 md:py-32 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-neutral-200/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-neutral-300/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-center mb-4 sm:mb-6 animate-slide-in-up">
          {sectionTitle.split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="font-signature text-4xl sm:text-5xl md:text-6xl bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-neutral-600 text-center mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed animate-slide-in-up" style={{animationDelay: '0.1s'}}>
          {sectionSubtitle}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bento-card bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-medium text-center group border border-neutral-200/50 animate-slide-in-up" 
              style={{animationDelay: `${index * 100 + 200}ms`}}
            >
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-glow group-hover:scale-110 transition-transform duration-300">
                {React.cloneElement(step.icon, { className: "w-8 h-8 sm:w-10 sm:h-10 text-white" })}
              </div>
              <div className="absolute top-4 right-4 text-6xl font-signature text-neutral-200 opacity-20">
                {index + 1}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-neutral-800 group-hover:text-brand-600 transition-colors">{step.title}</h3>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
