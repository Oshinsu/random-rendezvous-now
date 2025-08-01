
import step1 from "@/assets/step-1.png";
import step2 from "@/assets/step-2.png";
import step3 from "@/assets/step-3.png";

const NoMoreSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-4 sm:mb-6">
          On Casse les Codes des <span>Applis Classiques</span>
        </h2>
        <div className="mb-8 sm:mb-10 max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-background/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-accent">🚧 Version Beta en cours !</h3>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              L'appli est encore en test, alors soyez cool avec nous ! Si vous trouvez des petits bugs, pas de panique - c'est gratuit et on bosse dessus 🛠️
            </p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-accent">⏰ Les Randers se réveillent le soir !</h3>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              Évitez les heures de bureau ! Les meilleurs moments pour trouver d'autres Randers ? Entre 17h et 23h. C'est là que ça bouge vraiment 🌙
            </p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-accent">🚀 Plus on est de fous, plus on rit !</h3>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              On lance le 1er août avec nos petits moyens et beaucoup d'espoir ! Alors parlez-en autour de vous et aidez-nous à faire grandir cette French Touch 🇫🇷
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `0ms`}}>
            <img src={step1} alt="Exit le Swipe Sans Fin" className="w-32 h-40 sm:w-40 sm:h-48 object-cover rounded-lg mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Exit le Swipe Sans Fin</h3>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">Le hasard choisit pour toi ! Plus de scroll infini, plus de choix impossibles.</p>
          </div>
          <div className="p-4 sm:p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `150ms`}}>
            <img src={step2} alt="Fini les Profils Bidons" className="w-32 h-40 sm:w-40 sm:h-48 object-cover rounded-lg mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Fini les Profils Bidons</h3>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">On se découvre en vrai, sans filtre ni faux-semblant !</p>
          </div>
          <div className="p-4 sm:p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `300ms`}}>
            <img src={step3} alt="Bye Bye le Blabla" className="w-32 h-40 sm:w-40 sm:h-48 object-cover rounded-lg mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Bye Bye le Blabla</h3>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">Moins de "salut ça va ?" sans fin, plus de vraies discussions !</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoMoreSection;
