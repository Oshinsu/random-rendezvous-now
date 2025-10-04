
import benefit1 from "@/assets/benefit-1.jpg";
import benefit2 from "@/assets/benefit-2.jpg";
import benefit3 from "@/assets/benefit-3.jpg";
import benefit4 from "@/assets/benefit-4.jpg";
import { useTranslation } from 'react-i18next';

const WhyRandomSection = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      image: benefit1,
      title: t('why_random.benefit1_title'),
      description: t('why_random.benefit1_desc'),
    },
    {
      image: benefit2,
      title: t('why_random.benefit2_title'),
      description: t('why_random.benefit2_desc'),
    },
    {
      image: benefit3,
      title: t('why_random.benefit3_title'),
      description: t('why_random.benefit3_desc'),
    },
    {
      image: benefit4,
      title: t('why_random.benefit4_title'),
      description: t('why_random.benefit4_desc'),
    },
  ];
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          {t('why_random.title').split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="text-primary">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('why_random.subtitle')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in border border-amber-100" style={{animationDelay: `${index * 150}ms`}}>
              {/* Image de fond avec overlay */}
              <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                <img 
                  src={benefit.image} 
                  alt={`Random - ${benefit.title}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80"></div>
                
                {/* Titre superposé sur l'image */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-lg">{benefit.title}</h3>
                </div>
              </div>
              
              {/* Contenu avec description */}
              <div className="p-4 sm:p-6 bg-gradient-to-br from-white to-amber-50/30">
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed group-hover:text-foreground transition-colors duration-300">
                  {benefit.description}
                </p>
                
                {/* Décoration */}
                <div className="mt-3 sm:mt-4 w-10 sm:w-12 h-1 bg-gradient-to-r from-primary to-amber-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
