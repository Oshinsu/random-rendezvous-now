
import benefit1 from "@/assets/new-benefit-1.jpg";
import benefit2 from "@/assets/new-benefit-2.jpg";
import benefit3 from "@/assets/new-benefit-3.jpg";
import benefit4 from "@/assets/new-benefit-4.jpg";

const benefits = [
  {
    image: benefit1,
    title: "100% Vrai",
    description: "Pas de filtres, pas de faux-semblants. Tu es toi-même, les autres aussi !",
  },
  {
    image: benefit2,
    title: "La Magie du Hasard",
    description: "Chaque soirée est une surprise ! Tu ne sais jamais qui tu vas rencontrer.",
  },
  {
    image: benefit3,
    title: "Super Simple",
    description: "Un clic et c'est parti ! Moins de temps sur ton téléphone, plus de vrais moments.",
  },
  {
    image: benefit4,
    title: "Gratuit & Sûr",
    description: "Beta gratuite à Paris ! Bars soigneusement sélectionnés, ta sécurité avant tout.",
  },
];

const WhyRandomSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Pourquoi <span className="text-primary">Random</span> Change Tout ?
        </h2>
        <p className="text-base text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Parce qu'il est temps de retrouver des soirées authentiques et des vraies rencontres !
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in border border-amber-100" style={{animationDelay: `${index * 150}ms`}}>
              {/* Image de fond avec overlay */}
              <div className="relative h-48 w-full overflow-hidden">
                <img 
                  src={benefit.image} 
                  alt={benefit.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80"></div>
                
                {/* Titre superposé sur l'image */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{benefit.title}</h3>
                </div>
              </div>
              
              {/* Contenu avec description */}
              <div className="p-6 bg-gradient-to-br from-white to-amber-50/30">
                <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground transition-colors duration-300">
                  {benefit.description}
                </p>
                
                {/* Décoration */}
                <div className="mt-4 w-12 h-1 bg-gradient-to-r from-primary to-amber-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
