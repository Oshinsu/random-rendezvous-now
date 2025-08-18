import { useTranslation } from "react-i18next";
import benefit1 from "@/assets/new-benefit-1.jpg";
import benefit2 from "@/assets/new-benefit-2.jpg";
import benefit3 from "@/assets/new-benefit-3.jpg";
import benefit4 from "@/assets/new-benefit-4.jpg";

const WhyRandomSection = () => {
  const { i18n } = useTranslation();
  
  const benefits = [
    {
      image: benefit1,
      title: i18n.language === 'en' ? 'Authentic' : 'Authentique',
      description: i18n.language === 'en' ? 'Meet real people in real life' : 'Rencontrez de vraies personnes dans la vraie vie',
    },
    {
      image: benefit2,
      title: i18n.language === 'en' ? 'Spontaneous' : 'Spontané',
      description: i18n.language === 'en' ? 'Break the routine with impromptu encounters' : 'Brisez la routine avec des rencontres impromptues',
    },
    {
      image: benefit3,
      title: i18n.language === 'en' ? 'Secure' : 'Sécurisé',
      description: i18n.language === 'en' ? 'Your data is protected and your safety is our priority' : 'Vos données sont protégées et votre sécurité est notre priorité',
    },
    {
      image: benefit4,
      title: i18n.language === 'en' ? 'Local' : 'Local',
      description: i18n.language === 'en' ? 'Discover your city in a new light' : 'Découvrez votre ville sous un nouveau jour',
    },
  ];
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          {i18n.language === 'en' ? 'Why choose Random?' : 'Pourquoi choisir Random ?'}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          Parce qu'il est temps de retrouver des soirées authentiques et des vraies rencontres !
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