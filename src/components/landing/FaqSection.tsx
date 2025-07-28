
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Vraiment 100% random ? Et si je tombe avec des gens bizarres ?",
    answer: "C'est tout l'intérêt ! Le 'bizarre' d'aujourd'hui pourrait être ton nouveau meilleur pote demain. Au pire, tu auras une super anecdote à raconter ! Le risque fait partie du charme.",
  },
  {
    question: "Pourquoi je ne vois pas le bar avant de confirmer ?",
    answer: "Le mystère fait partie de l'expérience ! On te garantit un lieu sympa et accessible. Fais confiance au hasard et à notre sélection soigneuse de bars partenaires.",
  },
  {
    question: "Et si le groupe ne me plaît pas ?",
    answer: "Random n'est pas un dating app ! L'objectif : passer un super moment et élargir ton cercle social. Reste ouvert, la magie opère souvent quand on s'y attend le moins !",
  },
  {
    question: "C'est vraiment gratuit ?",
    answer: "Oui, complètement ! Beta gratuite à Paris du 1er août au 1er septembre. Notre mission : révolutionner tes soirées, pas vider ton portefeuille !",
  },
  {
    question: "C'est sécurisé ?",
    answer: "Totalement. Lieux publics uniquement, et l'effet de groupe ajoute une sécurité naturelle. Ta tranquillité d'esprit = notre obsession."
  }
];

const FaqSection = () => {
  return (
    <section className="py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
          Questions <span className="text-primary">Brûlantes</span> ?
        </h2>
        <p className="text-base text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          On répond franchement, sans détour. Comme on aime chez Random !
        </p>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border-b-muted/50 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              <AccordionTrigger className="text-left text-base hover:no-underline py-4 font-semibold hover:text-primary transition-colors duration-300">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 pt-2 text-sm leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FaqSection;
