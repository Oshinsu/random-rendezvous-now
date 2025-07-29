
// Images supprimées

const benefits = [
  {
    title: "100% Vrai",
    description: "Pas de filtres, pas de faux-semblants. Tu es toi-même, les autres aussi !",
  },
  {
    title: "La Magie du Hasard",
    description: "Chaque soirée est une surprise ! Tu ne sais jamais qui tu vas rencontrer.",
  },
  {
    title: "Super Simple",
    description: "Un clic et c'est parti ! Moins de temps sur ton téléphone, plus de vrais moments.",
  },
  {
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
               
              {/* Contenu principal */}
              <div className="p-8 bg-gradient-to-br from-white to-amber-50/30">
                <h3 className="text-2xl font-bold text-foreground mb-4">{benefit.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed group-hover:text-foreground transition-colors duration-300">
                  {benefit.description}
                </p>
                
                {/* Décoration */}
                <div className="mt-6 w-16 h-1 bg-gradient-to-r from-primary to-amber-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyRandomSection;
