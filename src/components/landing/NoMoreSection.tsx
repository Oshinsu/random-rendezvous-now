
import { XCircle } from "lucide-react";

const NoMoreSection = () => {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
          Fini les Schémas Classiques !
        </h2>
        <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
          Random brise les codes. Prépare-toi à une expérience sociale qui n'a rien à voir avec ce que tu connais.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-background/10 rounded-lg animate-fade-in" style={{animationDelay: `0ms`}}>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-primary-foreground" />
            <h3 className="text-2xl font-bold mb-2">Bye Bye le Swipe Éternel</h3>
            <p>Ici, on ne choisit pas son menu, on découvre la spécialité du chef. Le hasard fait bien les choses.</p>
          </div>
          <div className="p-6 bg-background/10 rounded-lg animate-fade-in" style={{animationDelay: `150ms`}}>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-primary-foreground" />
            <h3 className="text-2xl font-bold mb-2">Adieu les Profils Surfaits</h3>
            <p>Personne ne se vend, personne ne triche. On se rencontre, point. L'authenticité avant tout.</p>
          </div>
          <div className="p-6 bg-background/10 rounded-lg animate-fade-in" style={{animationDelay: `300ms`}}>
            <XCircle className="w-12 h-12 mx-auto mb-4 text-primary-foreground" />
            <h3 className="text-2xl font-bold mb-2">Stop aux Discussions Stériles</h3>
            <p>Moins de tchat qui tourne en rond, plus de "chin-chin" et de vrais échanges. Directement IRL.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoMoreSection;
