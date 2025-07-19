
import { Star, Coffee, Music, Laugh } from "lucide-react";

const AmbianceSection = () => {
  const photos = [
    {
      url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&h=400&fit=crop",
      alt: "Groupe d'amis riant dans un bar",
      caption: "L'ambiance Random"
    },
    {
      url: "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=600&h=400&fit=crop",
      alt: "Soirée conviviale entre amis",
      caption: "Vraies connexions"
    },
    {
      url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop",
      alt: "Moment de détente au bar",
      caption: "Moments authentiques"
    },
    {
      url: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=600&h=400&fit=crop",
      alt: "Ambiance chaleureuse",
      caption: "Ambiance unique"
    }
  ];

  const vibes = [
    {
      icon: <Coffee className="w-6 h-6 text-amber-600" />,
      title: "Bars Authentiques",
      description: "Des lieux sélectionnés pour leur ambiance chaleureuse et leur capacité à créer des liens."
    },
    {
      icon: <Music className="w-6 h-6 text-orange-600" />,
      title: "Atmosphère Unique",
      description: "Chaque soirée Random a sa propre personnalité, créée par la magie de la rencontre."
    },
    {
      icon: <Laugh className="w-6 h-6 text-amber-700" />,
      title: "Moments Inoubliables",
      description: "Des fous rires spontanés aux discussions profondes, chaque instant compte."
    },
    {
      icon: <Star className="w-6 h-6 text-orange-700" />,
      title: "Connections Réelles",
      description: "Au-delà des écrans, Random crée des liens authentiques qui durent."
    }
  ];

  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            L'<span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Ambiance</span> Random
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez l'atmosphère unique qui fait de chaque soirée Random une expérience mémorable.
          </p>
        </div>

        {/* Photo Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {photos.map((photo, index) => (
            <div key={index} className="group relative overflow-hidden rounded-3xl shadow-medium hover:shadow-strong transition-all duration-500 transform hover:scale-105" style={{animationDelay: `${index * 150}ms`}}>
              <img 
                src={photo.url} 
                alt={photo.alt}
                className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Vibes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {vibes.map((vibe, index) => (
            <div key={index} className="flex items-start space-x-6 p-8 bg-white/70 backdrop-blur-sm rounded-3xl border border-amber-200/50 hover:bg-white/90 hover:border-amber-300/70 transition-all duration-300 hover:shadow-medium group" style={{animationDelay: `${index * 100}ms`}}>
              <div className="flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100 p-4 rounded-2xl group-hover:from-amber-200 group-hover:to-orange-200 transition-all duration-300">
                {vibe.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-800 mb-3 group-hover:text-amber-700 transition-colors duration-300">{vibe.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{vibe.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AmbianceSection;
