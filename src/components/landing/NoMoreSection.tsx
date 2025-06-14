
import { XCircle } from "lucide-react";

const NoMoreSection = () => {
  return (
    <section className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
          On Casse les Codes des <span className="underline decoration-wavy">Applis Classiques</span>
        </h2>
        <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto opacity-90">
          Random révolutionne les rencontres. Prépare-toi à vivre quelque chose de complètement différent.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `0ms`}}>
            <XCircle className="w-10 h-10 mx-auto mb-4 text-primary-foreground group-hover:animate-pulse" />
            <h3 className="text-xl font-bold mb-3">Exit le Swipe Infini</h3>
            <p className="text-sm opacity-90 leading-relaxed">Le hasard choisit pour toi. Enfin libéré du scroll sans fin et des décisions paralysantes.</p>
          </div>
          <div className="p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `150ms`}}>
            <XCircle className="w-10 h-10 mx-auto mb-4 text-primary-foreground group-hover:animate-pulse" />
            <h3 className="text-xl font-bold mb-3">Fini les Profils Fake</h3>
            <p className="text-sm opacity-90 leading-relaxed">Personne ne se vend, personne ne ment. On se découvre en vrai, sans filtre ni artifice.</p>
          </div>
          <div className="p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `300ms`}}>
            <XCircle className="w-10 h-10 mx-auto mb-4 text-primary-foreground group-hover:animate-pulse" />
            <h3 className="text-xl font-bold mb-3">Bye Bye le Small Talk</h3>
            <p className="text-sm opacity-90 leading-relaxed">Moins de "salut ça va ?" interminables, plus de vraies discussions autour d'un verre.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoMoreSection;
