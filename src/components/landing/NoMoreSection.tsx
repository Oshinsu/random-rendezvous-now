
import step1 from "@/assets/step-1.png";
import step2 from "@/assets/step-2.png";
import step3 from "@/assets/step-3.png";

const NoMoreSection = () => {
  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
          On Casse les Codes des <span className="underline decoration-wavy">Applis Classiques</span>
        </h2>
        <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto opacity-90">
          Random, c'est différent ! Prépare-toi à vivre quelque chose de totalement nouveau.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `0ms`}}>
            <img src={step1} alt="Exit le Swipe Sans Fin" className="w-40 h-48 object-cover rounded-lg mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3">Exit le Swipe Sans Fin</h3>
            <p className="text-sm opacity-90 leading-relaxed">Le hasard choisit pour toi ! Plus de scroll infini, plus de choix impossibles.</p>
          </div>
          <div className="p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `150ms`}}>
            <img src={step2} alt="Fini les Profils Bidons" className="w-40 h-48 object-cover rounded-lg mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3">Fini les Profils Bidons</h3>
            <p className="text-sm opacity-90 leading-relaxed">On se découvre en vrai, sans filtre ni faux-semblant !</p>
          </div>
          <div className="p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `300ms`}}>
            <img src={step3} alt="Bye Bye le Blabla" className="w-40 h-48 object-cover rounded-lg mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-3">Bye Bye le Blabla</h3>
            <p className="text-sm opacity-90 leading-relaxed">Moins de "salut ça va ?" sans fin, plus de vraies discussions !</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoMoreSection;
