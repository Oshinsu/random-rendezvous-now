
import React from "react";
import { useTranslation } from "react-i18next";
import { HandMetal, Users, MapPin, GlassWater } from "lucide-react";

const HowItWorksSection = () => {
  const { i18n } = useTranslation();
  
  const steps = [
    {
      icon: <HandMetal className="w-10 h-10 text-primary mb-4" />,
      title: i18n.language === 'en' ? 'Create your profile' : 'Créez votre profil',
      description: i18n.language === 'en' ? 'Set up your preferences and define your interests' : 'Configurez vos préférences et définissez vos centres d\'intérêt',
    },
    {
      icon: <Users className="w-10 h-10 text-primary mb-4" />,
      title: i18n.language === 'en' ? 'Join a group' : 'Rejoignez un groupe',
      description: i18n.language === 'en' ? 'Discover groups near you and connect' : 'Découvrez des groupes près de chez vous et connectez-vous',
    },
    {
      icon: <MapPin className="w-10 h-10 text-primary mb-4" />,
      title: i18n.language === 'en' ? 'Live the adventure' : 'Vivez l\'aventure',
      description: i18n.language === 'en' ? 'Participate in spontaneous activities and meet new people' : 'Participez à des activités spontanées et rencontrez de nouvelles personnes',
    },
    {
      icon: <GlassWater className="w-10 h-10 text-primary mb-4" />,
      title: i18n.language === 'en' ? 'Enjoy drinks' : 'Savourez vos verres',
      description: i18n.language === 'en' ? 'Meet at the chosen bar and enjoy the moment together' : 'Retrouvez-vous dans le bar choisi et savourez le moment ensemble',
    },
  ];
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          {i18n.language === 'en' ? 'How it works?' : 'Comment ça marche ?'}
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
