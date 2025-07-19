
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Vraiment 100% random ? Et si je tombe avec des gens bizarres ?",
    answer: "C'est tout l'intérêt ! Le 'bizarre' d'aujourd'hui pourrait être ton nouveau meilleur pote demain. Au pire, tu auras une super anecdote à raconter. Le risque fait partie du charme, non ?",
  },
  {
    question: "Pourquoi je ne vois pas le bar avant de confirmer ?",
    answer: "Le mystère fait partie de l'expérience ! On te garantit un lieu sympa et accessible. Fais confiance au hasard et à notre sélection croissante de bars partenaires dans ta ville.",
  },
  {
    question: "Et si le groupe ne me plaît pas ?",
    answer: "Random n'est pas Tinder en groupe. L'objectif : passer un bon moment et élargir ton cercle social. Reste ouvert, la magie opère souvent quand on s'y attend le moins !",
  },
  {
    question: "C'est vraiment gratuit ?",
    answer: "Oui, complètement ! On veut que tu découvres l'expérience Random sans barrière. Notre mission : révolutionner tes soirées, pas vider ton portefeuille.",
  },
  {
    question: "C'est sécurisé ?",
    answer: "Totalement. Lieux publics uniquement, et l'effet de groupe ajoute une sécurité naturelle. Ta tranquillité d'esprit = notre obsession."
  },
  {
    question: "Random est disponible dans ma ville ?",
    answer: "Random est actuellement actif dans plusieurs grandes villes françaises et continue son déploiement. Consulte la section 'Villes disponibles' pour voir si Random est déjà arrivé près de chez toi !"
  }
];

const FaqSection = () => {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-neutral-50 to-amber-50/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-6">
            Questions <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Brûlantes</span> ?
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            On répond cash, sans détour. Comme on aime chez Random.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border-b border-amber-200/30 animate-fade-in bg-white/50 backdrop-blur-sm rounded-2xl mb-4 px-6 hover:bg-white/80 transition-all duration-300" style={{animationDelay: `${index * 100}ms`}}>
                <AccordionTrigger className="text-left text-lg hover:no-underline py-6 font-bold hover:text-amber-700 transition-colors duration-300">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 pb-6 pt-2 leading-relaxed text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-12 p-8 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-3xl border border-amber-200/30">
          <p className="text-lg text-neutral-700 font-medium mb-2">
            Une autre question ?
          </p>
          <p className="text-neutral-500">
            Notre équipe est là pour t'accompagner dans ton aventure Random !
          </p>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
