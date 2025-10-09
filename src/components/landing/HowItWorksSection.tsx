
import React from "react";
import { HandMetal, Users, MapPin, GlassWater } from "lucide-react";
import { useTranslation } from 'react-i18next';

const HowItWorksSection = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: <HandMetal className="w-10 h-10 text-primary mb-4" />,
      title: t('how_it_works.step1_title'),
      description: t('how_it_works.step1_desc'),
    },
    {
      icon: <Users className="w-10 h-10 text-primary mb-4" />,
      title: t('how_it_works.step2_title'),
      description: t('how_it_works.step2_desc'),
    },
    {
      icon: <MapPin className="w-10 h-10 text-primary mb-4" />,
      title: t('how_it_works.step3_title'),
      description: t('how_it_works.step3_desc'),
    },
    {
      icon: <GlassWater className="w-10 h-10 text-primary mb-4" />,
      title: t('how_it_works.step4_title'),
      description: t('how_it_works.step4_desc'),
    },
  ];
  return (
    <section className="py-16 sm:py-20 md:py-32 bg-gradient-to-br from-secondary via-white to-brand-50/20 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-brand-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-300/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-center mb-4 sm:mb-6 animate-slide-in-up">
          {t('how_it_works.title').split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="font-signature text-4xl sm:text-5xl md:text-6xl gradient-text-animated">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground text-center mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed animate-slide-in-up" style={{animationDelay: '0.1s'}}>
          {t('how_it_works.subtitle')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bento-card bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-medium text-center group border border-brand-200/30 animate-slide-in-up" 
              style={{animationDelay: `${index * 100 + 200}ms`}}
            >
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-6 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow group-hover:scale-110 transition-transform duration-300">
                {React.cloneElement(step.icon, { className: "w-8 h-8 sm:w-10 sm:h-10 text-white" })}
              </div>
              <div className="absolute top-4 right-4 text-6xl font-signature text-brand-200 opacity-20">
                {index + 1}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-foreground group-hover:text-brand-600 transition-colors">{step.title}</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
