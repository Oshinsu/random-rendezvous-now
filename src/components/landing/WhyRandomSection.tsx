import { useTranslation } from 'react-i18next';
import { useDynamicContent } from '@/hooks/useDynamicContent';
import { OptimizedImage } from '@/components/OptimizedImage';

const WhyRandomSection = () => {
  const { t } = useTranslation();
  const { getContent } = useDynamicContent();

  const benefits = [
    {
      image: getContent('benefit_1_image_url', '/src/assets/new-benefit-1.jpg'),
      title: t('why_random.benefit1_title'),
      description: t('why_random.benefit1_desc'),
    },
    {
      image: getContent('benefit_2_image_url', '/src/assets/new-benefit-2.jpg'),
      title: t('why_random.benefit2_title'),
      description: t('why_random.benefit2_desc'),
    },
    {
      image: getContent('benefit_3_image_url', '/src/assets/new-benefit-3.jpg'),
      title: t('why_random.benefit3_title'),
      description: t('why_random.benefit3_desc'),
    },
    {
      image: getContent('benefit_4_image_url', '/src/assets/new-benefit-4.jpg'),
      title: t('why_random.benefit4_title'),
      description: t('why_random.benefit4_desc'),
    },
  ];
  return (
    <section className="py-16 sm:py-20 md:py-32 bg-gradient-to-br from-white via-brand-50/10 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-20 w-72 h-72 bg-brand-200/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-brand-300/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-center mb-4 sm:mb-6 animate-slide-in-up">
          {t('why_random.title').split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="font-signature text-4xl sm:text-5xl md:text-6xl gradient-text-animated">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground text-center mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed animate-slide-in-up" style={{animationDelay: '0.1s'}}>
          {t('why_random.subtitle')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bento-card group relative overflow-hidden rounded-3xl bg-white shadow-strong border border-brand-200/20 animate-slide-in-up" 
              style={{animationDelay: `${index * 100 + 200}ms`}}
            >
              {/* Image avec Ken Burns effect */}
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <OptimizedImage
                  src={benefit.image} 
                  alt={`Random - ${benefit.title}`}
                  className="w-full h-full object-cover ken-burns"
                  priority={index === 0}
                  width={800}
                  quality={85}
                />
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
                  }}
                ></div>
                
                {/* Numéro stylisé */}
                <div className="absolute top-4 right-4 text-8xl font-signature text-white/20">
                  {index + 1}
                </div>
                
                {/* Titre sur l'image */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-2xl">{benefit.title}</h3>
                </div>
              </div>
              
              {/* Description */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-brand-50/30 to-white">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed group-hover:text-foreground transition-colors duration-300">
                  {benefit.description}
                </p>
                
                {/* Barre décorative animée */}
                <div className="mt-4 sm:mt-6 h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
