
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pushEvent } from "@/utils/marketingAnalytics";

const faqs = [
  {
    question: "C’est vraiment non-dating ?",
    answer:
      "Oui. Random, c’est du social en groupe (5 personnes), pas du 1‑to‑1 romantique.",
  },
  {
    question: "C'est sécurisé ?",
    answer:
      "Oui : bars publics, groupe de 5, bouton report, modération sous 24h.",
  },
  {
    question: "Et si le groupe ne me convient pas ?",
    answer:
      "Tu peux quitter et relancer. Zéro pression.",
  },
  {
    question: "Paris uniquement ?",
    answer: "Oui, jusqu'au 30 sept. (bêta gratuite).",
  },
  {
    question: "C'est gratuit ?",
    answer: "Oui, la bêta est gratuite à Paris jusqu'au 30 septembre.",
  },
  {
    question: "Pourquoi le bar est révélé après ?",
    answer:
      "Pour garder la surprise. Nous choisissons un bar ouvert, accessible et validé.",
  },
];

const FaqSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          Questions <span className="text-primary">Brûlantes</span> ?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          On répond franchement, sans détour. Comme on aime chez Random !
        </p>
        <Accordion type="multiple" defaultValue={["item-0","item-1","item-2"]} className="w-full max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border-b-muted/50 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              <AccordionTrigger onClick={() => pushEvent('faq_open', { question: faq.question })} className="text-left text-sm sm:text-base hover:no-underline py-3 sm:py-4 font-semibold hover:text-primary transition-colors duration-300">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-3 sm:pb-4 pt-2 text-xs sm:text-sm leading-relaxed">
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
