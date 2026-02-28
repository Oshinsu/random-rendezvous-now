import { useDynamicContent } from '@/hooks/useDynamicContent';
import benefit1Img from "@/assets/new-benefit-1.jpg";
import benefit2Img from "@/assets/new-benefit-2.jpg";
import benefit3Img from "@/assets/new-benefit-3.jpg";
import benefit4Img from "@/assets/new-benefit-4.jpg";

const WhyRandomSection = () => {
  const { getContent } = useDynamicContent();

  const localImages = [benefit1Img, benefit2Img, benefit3Img, benefit4Img];

  const benefits = [
    {
      icon: getContent('benefit_1_icon_new', '🎲'),
      image: getContent('benefit_1_image_url', '') || localImages[0],
      title: getContent('benefit_1_title_new', 'Zéro filtre, 100% vrai'),
      description: getContent('benefit_1_description_new', 'Pas de matching par intérêt, pas de profil optimisé. 5 inconnus tirés au sort. C\'est ça la magie.'),
    },
    {
      icon: getContent('benefit_2_icon_new', '🍹'),
      image: getContent('benefit_2_image_url', '') || localImages[1],
      title: getContent('benefit_2_title_new', 'Le bar, c\'est la surprise'),
      description: getContent('benefit_2_description_new', 'Un bar tiré au sort dans ta zone. Ouvert, accessible, validé. Tu découvres où tu vas en même temps que le groupe.'),
    },
    {
      icon: getContent('benefit_3_icon_new', '⚡'),
      image: getContent('benefit_3_image_url', '') || localImages[2],
      title: getContent('benefit_3_title_new', '1 clic. C\'est tout.'),
      description: getContent('benefit_3_description_new', 'Un bouton. On s\'occupe du reste. Moins de temps sur l\'écran, plus de temps en vrai.'),
    },
    {
      icon: getContent('benefit_4_icon_new', '🛡️'),
      image: getContent('benefit_4_image_url', '') || localImages[3],
      title: getContent('benefit_4_title_new', 'Lieux publics, groupes de 5'),
      description: getContent('benefit_4_description_new', 'Toujours dans des bars ouverts, toujours à 5. L\'ambiance de groupe crée naturellement la sécurité.'),
    },
  ];

  const sectionTitle = getContent('benefits_main_title', 'Pourquoi Random change tout ?');
  const sectionSubtitle = getContent('benefits_main_subtitle', 'Parce que les vraies rencontres ne se planifient pas.');
  
  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 relative overflow-hidden">
      <div className="absolute top-10 left-20 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-20 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-center mb-3 sm:mb-4 animate-slide-in-up text-neutral-900">
          {sectionTitle.split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="font-signature text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-transparent">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-sm sm:text-base text-neutral-500 text-center mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-in-up italic" style={{animationDelay: '0.1s'}}>
          {sectionSubtitle}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bento-card group relative overflow-hidden rounded-3xl bg-white shadow-strong border border-neutral-200/50 animate-slide-in-up" 
              style={{animationDelay: `${index * 100 + 200}ms`}}
            >
              {/* Image avec Ken Burns effect */}
              <div className="relative h-52 sm:h-64 w-full overflow-hidden">
                <img
                  src={benefit.image as string}
                  alt={`Random - ${benefit.title}`}
                  className="w-full h-full object-cover ken-burns"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div 
                  className="absolute inset-0 transition-all duration-500 group-hover:opacity-80"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.1) 100%)'
                  }}
                ></div>

                {/* Icône flottante */}
                <div className="absolute top-4 right-4 text-3xl filter drop-shadow-2xl group-hover:scale-125 transition-transform duration-300">
                  {benefit.icon}
                </div>
                
                {/* Titre sur l'image */}
                <div className="absolute bottom-4 sm:bottom-5 left-5 right-5">
                  <h3 className="text-lg sm:text-xl font-bold text-white filter drop-shadow-lg">{benefit.title}</h3>
                </div>
              </div>
              
              {/* Description */}
              <div className="p-5 sm:p-6">
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed group-hover:text-neutral-800 transition-colors duration-300">
                  {benefit.description}
                </p>
                <div className="mt-4 h-0.5 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
