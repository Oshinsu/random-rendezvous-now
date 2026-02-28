
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from 'react-i18next';

const FaqSection = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('faq.q1'),
      answer: t('faq.a1'),
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2'),
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3'),
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4'),
    },
    {
      question: t('faq.q5'),
      answer: t('faq.a5'),
    }
  ];
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-neutral-950 relative overflow-hidden">
      {/* Même texture que HowItWorks pour cohérence sections sombres */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(241,194,50,0.8) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-center mb-3 sm:mb-4 text-white">
          {t('faq.title').split('Random').map((part, index, array) => (
            index < array.length - 1 ? (
              <span key={index}>{part}<span className="font-signature text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">Random</span></span>
            ) : (
              <span key={index}>{part}</span>
            )
          ))}
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('faq.subtitle')}
        </p>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border-b border-white/5 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              <AccordionTrigger className="text-left text-sm sm:text-base hover:no-underline py-3 sm:py-4 font-semibold text-white hover:text-brand-400 transition-colors duration-300">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-neutral-400 pb-3 sm:pb-4 pt-2 text-xs sm:text-sm leading-relaxed">
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
