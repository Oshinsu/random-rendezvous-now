
import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah M.",
      age: 26,
      city: "Lyon",
      rating: 5,
      comment: "J'étais sceptique au début, mais Random a complètement changé ma vision des sorties ! J'ai rencontré des personnes incroyables et découvert des bars que je n'aurais jamais trouvés seule.",
      photo: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=80&h=80&fit=crop&crop=face"
    },
    {
      name: "Thomas L.",
      age: 29,
      city: "Marseille",
      rating: 5,
      comment: "Après 6 mois sur Random, j'ai gardé contact avec la moitié des personnes rencontrées. C'est fou comme on peut créer des liens authentiques en quelques heures !",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
    },
    {
      name: "Emma R.",
      age: 24,
      city: "Toulouse",
      rating: 5,
      comment: "Random a brisé ma routine ! Fini les vendredis soirs devant Netflix. Maintenant, chaque sortie est une petite aventure avec de belles surprises.",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
    },
    {
      name: "Alex D.",
      age: 31,
      city: "Nantes",
      rating: 5,
      comment: "L'app parfaite pour les timides comme moi ! Le cadre Random enlève toute la pression du premier contact. On se retrouve naturellement dans la conversation.",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
    },
    {
      name: "Léa B.",
      age: 27,
      city: "Bordeaux",
      rating: 5,
      comment: "Ce qui me plaît chez Random, c'est l'authenticité. Pas de faux-semblants, juste des vraies personnes avec des vraies histoires à partager.",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face"
    },
    {
      name: "Jules M.",
      age: 25,
      city: "Lille",
      rating: 5,
      comment: "Random m'a fait sortir de ma zone de confort et j'en suis reconnaissant ! Chaque soirée est unique, imprévisible et toujours mémorable.",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face"
    }
  ];

  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-white to-amber-50/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            Ils ont <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Testé</span> Random
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Des témoignages authentiques de nos aventuriers qui ont osé sortir de leur zone de confort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="relative p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft hover:shadow-medium border border-amber-100/50 hover:border-amber-200/70 transition-all duration-300 group hover:scale-105" style={{animationDelay: `${index * 100}ms`}}>
              {/* Quote icon */}
              <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                <Quote className="w-8 h-8 text-amber-600" />
              </div>

              {/* Profile */}
              <div className="flex items-center mb-6">
                <img 
                  src={testimonial.photo} 
                  alt={`Photo de ${testimonial.name}`}
                  className="w-16 h-16 rounded-full object-cover border-3 border-amber-200/50 mr-4"
                />
                <div>
                  <h4 className="font-bold text-lg text-neutral-800">{testimonial.name}</h4>
                  <p className="text-neutral-500 text-sm">{testimonial.age} ans • {testimonial.city}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                ))}
              </div>

              {/* Testimonial */}
              <p className="text-neutral-700 leading-relaxed italic">
                "{testimonial.comment}"
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-neutral-600 mb-6">
            Rejoignez-les et créez votre propre histoire Random !
          </p>
          <div className="flex justify-center items-center gap-2 text-amber-600">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-bold text-lg">4.9/5</span>
            <span className="text-neutral-500">• Plus de 2,000 avis</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
