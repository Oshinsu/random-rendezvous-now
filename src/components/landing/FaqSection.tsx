
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Sérieux, 100% random ? Et si je tombe avec des gens bizarres ?",
    answer: "C'est ça, l'aventure ! Et hey, le 'bizarre' d'aujourd'hui est peut-être ton meilleur pote de demain. Au pire, c'est une histoire à raconter pour 1€. Le risque est fun, non ?",
  },
  {
    question: "Je ne vois pas de carte avant de payer ? Un peu flippant, non ?",
    answer: "Le mystère fait partie du jeu ! On te garantit un bar sympa et accessible. Fais confiance au hasard (et à notre sélection de bars partenaires qui grandit chaque jour).",
  },
  {
    question: "Et si personne ne me plaît dans le groupe ?",
    answer: "Random, c'est pas Tinder avec un G. L'idée, c'est de passer un bon moment, élargir ton cercle, pas de trouver l'âme sœur en 5 minutes. Chill. Le but est la rencontre, l'expérience sociale.",
  },
  {
    question: "1€ par personne ? Pourquoi payer ?",
    answer: "Pour garantir l'engagement (moins de lapins !), éviter les faux comptes, et nous permettre de te proposer une expérience sans pub, de qualité, et de développer des partenariats avec les meilleurs bars.",
  },
  {
    question: "Est-ce que c'est sécurisé ?",
    answer: "Absolument. Le paiement est sécurisé. Nous travaillons uniquement avec des établissements publics. Et l'effet de groupe ajoute une sécurité naturelle. Ta tranquillité d'esprit est notre priorité."
  }
];

const FaqSection = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-12 md:mb-16">
          Vos Questions, <span className="text-primary">Nos Réponses (Sans Filtre)</span>
        </h2>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border-b-muted/50 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              <AccordionTrigger className="text-left text-lg hover:no-underline py-4 font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 pt-2">
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
