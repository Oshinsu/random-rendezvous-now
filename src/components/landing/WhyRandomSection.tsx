import { useDynamicContent } from '@/hooks/useDynamicContent';
import { OptimizedImage } from '@/components/OptimizedImage';

import defaultBenefit1 from '@/assets/new-benefit-1.jpg';
import defaultBenefit2 from '@/assets/new-benefit-2.jpg';
import defaultBenefit3 from '@/assets/new-benefit-3.jpg';
import defaultBenefit4 from '@/assets/new-benefit-4.jpg';

const WhyRandomSection = () => {
  const { getContent } = useDynamicContent();

  const benefits = [
    {
      image: getContent('benefit_1_image_url', defaultBenefit1),
      title: getContent('benefit_1_title', 'Des rencontres authentiques'),
      description: getContent('benefit_1_description', 'Finis les swipes infinis et les conversations qui mènent nulle part.'),
    },
    {
      image: getContent('benefit_2_image_url', defaultBenefit2),
      title: getContent('benefit_2_title', 'Zéro prise de tête'),
      description: getContent('benefit_2_description', "Plus besoin d'organiser, de choisir le lieu ou de coordonner les agendas."),
    },
    {
      image: getContent('benefit_3_image_url', defaultBenefit3),
      title: getContent('benefit_3_title', 'Sors de ta bulle'),
      description: getContent('benefit_3_description', 'Élargis ton cercle social sans effort.'),
    },
    {
      image: getContent('benefit_4_image_url', defaultBenefit4),
      title: getContent('benefit_4_title', 'Des soirées spontanées'),
      description: getContent('benefit_4_description', 'Un clic suffit pour transformer ta soirée.'),
    },
  ];

  const sectionTitle = getContent('benefits_section_title', 'Pourquoi Random ?');
  
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-white via-brand-50/30 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-20 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-brand-300/15 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-center mb-3 sm:mb-4 animate-slide-in-up">
          {sectionTitle.split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="font-signature text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-brand-400 via-brand-300 to-brand-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-text">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 text-center mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-in-up" style={{animationDelay: '0.1s'}}>
          {getContent('benefits_section_subtitle', 'Découvre pourquoi Random transforme tes sorties')}
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
                  <h3 className="text-xl sm:text-2xl font-bold text-white filter drop-shadow-2xl">{benefit.title}</h3>
                </div>
              </div>
              
              {/* Description */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-brand-50/20 to-white">
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed group-hover:text-neutral-900 transition-colors duration-300">
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
