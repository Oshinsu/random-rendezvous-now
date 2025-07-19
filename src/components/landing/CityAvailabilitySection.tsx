
import { MapPin, Clock, Users, Sparkles } from "lucide-react";

const CityAvailabilitySection = () => {
  const availableCities = [
    {
      name: "Paris",
      status: "active",
      users: "500+",
      bars: "50+",
      description: "La capitale de l'aventure urbaine"
    },
    {
      name: "Lyon",
      status: "active",
      users: "200+",
      bars: "25+",
      description: "Capitale gastronomique et Random"
    },
    {
      name: "Marseille",
      status: "active",
      users: "150+",
      bars: "20+",
      description: "L'esprit méditerranéen Random"
    },
    {
      name: "Toulouse",
      status: "active",
      users: "120+",
      bars: "18+",
      description: "La ville rose devient Random"
    },
    {
      name: "Bordeaux",
      status: "soon",
      users: "Bientôt",
      bars: "En cours",
      description: "Prochaine destination Random"
    },
    {
      name: "Nantes",
      status: "soon",
      users: "Bientôt",
      bars: "En cours",
      description: "L'aventure arrive bientôt"
    }
  ];

  const comingSoonCities = [
    "Lille", "Strasbourg", "Montpellier", "Rennes", "Nice", "Grenoble"
  ];

  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            Random <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Débarque</span> Partout
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            L'aventure Random s'étend dans toute la France. Découvrez où vivre l'expérience près de chez vous.
          </p>
        </div>

        {/* Active Cities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {availableCities.map((city, index) => (
            <div key={index} className={`relative p-8 rounded-3xl shadow-medium hover:shadow-strong transition-all duration-300 hover:scale-105 group ${city.status === 'active' ? 'bg-white border-2 border-green-200/50 hover:border-green-300/70' : 'bg-amber-50/50 border-2 border-amber-200/50 hover:border-amber-300/70'}`} style={{animationDelay: `${index * 100}ms`}}>
              
              {/* Status Badge */}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${city.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {city.status === 'active' ? '🟢 Actif' : '🔶 Bientôt'}
              </div>

              {/* City Header */}
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-3 rounded-2xl mr-4 group-hover:from-orange-200 group-hover:to-amber-200 transition-all duration-300">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-800 group-hover:text-orange-700 transition-colors duration-300">{city.name}</h3>
                  <p className="text-neutral-500 text-sm">{city.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-white/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-orange-600 mr-1" />
                  </div>
                  <p className="font-bold text-orange-700">{city.users}</p>
                  <p className="text-xs text-neutral-500">Aventuriers</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <Sparkles className="w-4 h-4 text-amber-600 mr-1" />
                  </div>
                  <p className="font-bold text-amber-700">{city.bars}</p>
                  <p className="text-xs text-neutral-500">Bars partenaires</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="text-center p-12 bg-gradient-to-r from-amber-100/50 to-orange-100/50 rounded-3xl border border-amber-200/50">
          <Clock className="w-12 h-12 text-amber-600 mx-auto mb-6 animate-pulse" />
          <h3 className="text-2xl font-bold text-neutral-800 mb-4">L'aventure arrive bientôt dans :</h3>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {comingSoonCities.map((city, index) => (
              <span key={index} className="px-4 py-2 bg-white/70 rounded-full text-neutral-700 font-medium border border-amber-200/50 hover:bg-white hover:border-amber-300/70 transition-all duration-300 cursor-pointer">
                {city}
              </span>
            ))}
          </div>
          <p className="text-neutral-600 mb-4">
            Votre ville n'est pas listée ? Faites-nous savoir !
          </p>
          <p className="text-sm text-amber-700 font-medium">
            📧 Contactez-nous pour accélérer l'arrivée de Random près de chez vous
          </p>
        </div>
      </div>
    </section>
  );
};

export default CityAvailabilitySection;
