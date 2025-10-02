import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";

interface Testimonial {
  name: string;
  avatar: string;
  role: string;
  content: string;
  rating: number;
}

const TestimonialsSection = () => {
  const { i18n } = useTranslation();

  const testimonials: Testimonial[] = i18n.language === 'en' ? [
    {
      name: "Sophie Martin",
      avatar: "SM",
      role: "Marketing Manager",
      content: "Random changed the way I meet people in Paris. No more endless swiping, just real connections over drinks. Met amazing people I wouldn't have otherwise!",
      rating: 5
    },
    {
      name: "Thomas Dubois",
      avatar: "TD",
      role: "Software Engineer",
      content: "The concept is brilliant - one click and you're set for the evening. The bar selection is always on point, and the group dynamics work surprisingly well.",
      rating: 5
    },
    {
      name: "Marie Chen",
      avatar: "MC",
      role: "Designer",
      content: "I was skeptical at first, but Random exceeded my expectations. Met genuine people, discovered new bars, and had unforgettable nights. It's addictive!",
      rating: 5
    },
    {
      name: "Lucas Bernard",
      avatar: "LB",
      role: "Entrepreneur",
      content: "Perfect for networking in a relaxed setting. Random brings together interesting people from different backgrounds. Already made business connections!",
      rating: 5
    }
  ] : [
    {
      name: "Sophie Martin",
      avatar: "SM",
      role: "Responsable Marketing",
      content: "Random a changé ma façon de rencontrer des gens à Paris. Plus de swipe infini, juste des vraies connexions autour d'un verre. J'ai rencontré des personnes incroyables !",
      rating: 5
    },
    {
      name: "Thomas Dubois",
      avatar: "TD",
      role: "Ingénieur",
      content: "Le concept est génial - un clic et c'est parti pour la soirée. Le choix des bars est toujours top, et la dynamique de groupe fonctionne étonnamment bien.",
      rating: 5
    },
    {
      name: "Marie Chen",
      avatar: "MC",
      role: "Designer",
      content: "J'étais sceptique au début, mais Random a dépassé mes attentes. Des personnes authentiques, de nouveaux bars, des soirées inoubliables. C'est addictif !",
      rating: 5
    },
    {
      name: "Lucas Bernard",
      avatar: "LB",
      role: "Entrepreneur",
      content: "Parfait pour networker dans un cadre détendu. Random réunit des personnes intéressantes de différents horizons. J'ai déjà fait des connexions pro !",
      rating: 5
    }
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {i18n.language === 'en' ? (
              <>What our <span className="text-primary">community</span> says</>
            ) : (
              <>Ce que dit notre <span className="text-primary">communauté</span></>
            )}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {i18n.language === 'en' 
              ? 'Join hundreds of Parisians making authentic connections'
              : 'Rejoins des centaines de Parisiens qui créent des connexions authentiques'
            }
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                <div className="p-1">
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover-scale">
                    <CardContent className="p-6">
                      <Quote className="h-8 w-8 text-primary/20 mb-4" />
                      
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>

                      <p className="text-foreground/90 mb-6 leading-relaxed">
                        "{testimonial.content}"
                      </p>

                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src="" alt={testimonial.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {testimonial.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialsSection;
