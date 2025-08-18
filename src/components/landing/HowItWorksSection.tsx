
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
    <section className="py-12 sm:py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          {t('how_it_works.title').split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="text-primary">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('how_it_works.subtitle')}
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
