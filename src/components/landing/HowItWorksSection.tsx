import React from "react";
import * as LucideIcons from "lucide-react";
import { useDynamicContent } from '@/hooks/useDynamicContent';
import step1Img from "@/assets/step-1.png";
import step2Img from "@/assets/step-2.png";
import step3Img from "@/assets/step-3.png";

const HowItWorksSection = () => {
  const { getContent } = useDynamicContent();

  const getDynamicIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
      return <LucideIcons.HelpCircle className="w-10 h-10 text-primary mb-4" />;
    }
    return <IconComponent className="w-10 h-10 text-primary mb-4" />;
  };

  const steps = [
    {
      icon: getDynamicIcon(getContent('how_it_works_step_1_icon', 'Zap')),
      image: step1Img,
      label: getContent('how_it_works_step_1_label', '01'),
      title: getContent('how_it_works_step_1_title', 'Tu cliques'),
      description: getContent('how_it_works_step_1_description', "Un bouton. C'est tout. Zéro profil à remplir, zéro friction."),
    },
    {
      icon: getDynamicIcon(getContent('how_it_works_step_2_icon', 'Shuffle')),
      image: step2Img,
      label: getContent('how_it_works_step_2_label', '02'),
      title: getContent('how_it_works_step_2_title', '5 inconnus débarquent'),
      description: getContent('how_it_works_step_2_description', 'Le hasard réunit 5 personnes. Toi compris. Zéro filtre, zéro algo.'),
    },
    {
      icon: getDynamicIcon(getContent('how_it_works_step_3_icon', 'Dices')),
      image: step3Img,
      label: getContent('how_it_works_step_3_label', '03'),
      title: getContent('how_it_works_step_3_title', 'Le bar se dévoile'),
      description: getContent('how_it_works_step_3_description', 'Un bar tiré au sort. Ouvert, proche, validé. La surprise fait partie du deal.'),
    },
    {
      icon: getDynamicIcon(getContent('how_it_works_step_4_icon', 'GlassWater')),
      image: null,
      label: getContent('how_it_works_step_4_label', '04'),
      title: getContent('how_it_works_step_4_title', 'Rendez-vous'),
      description: getContent('how_it_works_step_4_description', 'Dans l\'heure. Juste assez pour te préparer. La vie commence là.'),
    },
  ];

  const sectionTitle = getContent('how_it_works_main_title_new', 'Comment ça marche ?');
  const sectionSubtitle = getContent('how_it_works_subtitle_new', 'Un clic. Quatre étapes. Une vraie soirée.');

  return (
    <section className="py-16 sm:py-20 md:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Texture chaotique de fond */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(241,194,50,0.8) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }}></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-center mb-4 sm:mb-6 animate-slide-in-up text-white">
            {sectionTitle.split('Random').map((part, index, array) => (
              index < array.length - 1 ? (
                <span key={index}>{part}<span className="font-signature text-4xl sm:text-5xl md:text-6xl bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">Random</span></span>
              ) : (
                <span key={index}>{part}</span>
              )
            ))}
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 text-center max-w-2xl mx-auto leading-relaxed animate-slide-in-up" style={{animationDelay: '0.1s'}}>
            {sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="group relative rounded-3xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/8 transition-all duration-500 animate-slide-in-up" 
              style={{animationDelay: `${index * 100 + 200}ms`}}
            >
              {/* Image de fond si disponible */}
              {step.image && (
                <div className="absolute inset-0">
                  <img src={step.image} alt="" className="w-full h-full object-cover opacity-10 group-hover:opacity-15 transition-opacity duration-500 group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/40"></div>
                </div>
              )}

              <div className="relative p-6 sm:p-8 flex flex-col h-full min-h-[280px]">
                {/* Numéro énorme en arrière-plan */}
                <div className="absolute top-3 right-4 font-signature text-7xl sm:text-8xl text-white/[0.04] select-none leading-none">
                  {step.label}
                </div>

                {/* Icône */}
                <div className="inline-flex items-center justify-center w-12 h-12 mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-glow group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(step.icon, { className: "w-6 h-6 text-white" })}
                </div>

                {/* Pastille numéro */}
                <div className="text-xs font-bold text-brand-400 mb-2 tracking-widest uppercase">
                  Étape {step.label}
                </div>

                <h3 className="text-lg sm:text-xl font-bold mb-3 text-white group-hover:text-brand-300 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed group-hover:text-neutral-300 transition-colors duration-300 flex-grow">
                  {step.description}
                </p>

                {/* Ligne de connexion vers la prochaine étape (sauf dernière) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-brand-500 border-4 border-neutral-950 shadow-glow">
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
