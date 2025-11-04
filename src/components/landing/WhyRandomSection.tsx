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
      icon: getContent('benefit_1_icon_new', '🤝'),
      image: getContent('benefit_1_image_url', defaultBenefit1),
      title: getContent('benefit_1_title_new', 'Rencontres Authentiques'),
      description: getContent('benefit_1_description_new', 'Connectez-vous avec des personnes qui partagent vos centres d\'intérêt dans une ambiance décontractée'),
    },
    {
      icon: getContent('benefit_2_icon_new', '🍹'),
      image: getContent('benefit_2_image_url', defaultBenefit2),
      title: getContent('benefit_2_title_new', 'Découverte de Lieux'),
      description: getContent('benefit_2_description_new', 'Explorez les meilleurs bars et lieux branchés de votre ville sélectionnés spécialement pour vous'),
    },
    {
      icon: getContent('benefit_3_icon_new', '⚡'),
      image: getContent('benefit_3_image_url', defaultBenefit3),
      title: getContent('benefit_3_title_new', 'Simplicité Totale'),
      description: getContent('benefit_3_description_new', 'En quelques clics, rejoignez un groupe et laissez-nous nous occuper du reste'),
    },
    {
      icon: getContent('benefit_4_icon_new', '🛡️'),
      image: getContent('benefit_4_image_url', defaultBenefit4),
      title: getContent('benefit_4_title_new', 'Sécurité Garantie'),
      description: getContent('benefit_4_description_new', 'Tous nos membres sont vérifiés pour garantir des rencontres en toute sécurité'),
    },
  ];

  const sectionTitle = getContent('benefits_main_title', 'Pourquoi choisir Random ?');
  const sectionSubtitle = getContent('benefits_main_subtitle', 'Découvrez tous les avantages de rejoindre notre communauté');
  
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-20 w-72 h-72 bg-neutral-200/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-neutral-300/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-center mb-3 sm:mb-4 animate-slide-in-up">
          {sectionTitle.split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="font-signature text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 text-center mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-in-up" style={{animationDelay: '0.1s'}}>
          {sectionSubtitle}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bento-card group relative overflow-hidden rounded-3xl bg-white shadow-strong border border-neutral-200/50 animate-slide-in-up" 
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
                
                {/* Icône stylisée */}
                <div className="absolute top-4 right-4 text-6xl filter drop-shadow-2xl">
                  {benefit.icon}
                </div>
                
                {/* Titre sur l'image */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white filter drop-shadow-2xl">{benefit.title}</h3>
                </div>
              </div>
              
              {/* Description */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-neutral-50 to-neutral-100">
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed group-hover:text-neutral-900 transition-colors duration-300">
                  {benefit.description}
                </p>
                
                {/* Barre décorative animée */}
                <div className="mt-4 sm:mt-6 h-1.5 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
