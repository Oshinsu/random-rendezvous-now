
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqSection = () => {
  const { i18n } = useTranslation();
  
  const faqs = [
    {
      question: i18n.language === 'en' ? 'How does Random work?' : 'Comment fonctionne Random ?',
      answer: i18n.language === 'en' ? 'Random connects you with people near you for spontaneous activities. Simply create your profile and join groups that interest you.' : 'Random vous connecte avec des personnes près de chez vous pour des activités spontanées. Créez simplement votre profil et rejoignez des groupes qui vous intéressent.',
    },
    {
      question: i18n.language === 'en' ? 'Is the app free?' : 'L\'application est-elle gratuite ?',
      answer: i18n.language === 'en' ? 'Yes, Random is completely free to use. You can create your profile, join groups and participate in activities at no cost.' : 'Oui, Random est entièrement gratuite à utiliser. Vous pouvez créer votre profil, rejoindre des groupes et participer aux activités sans aucun coût.',
    },
    {
      question: i18n.language === 'en' ? 'How is my safety ensured?' : 'Comment ma sécurité est-elle assurée ?',
      answer: i18n.language === 'en' ? 'We take safety very seriously. All profiles are verified and we have reporting and moderation systems in place.' : 'Nous prenons la sécurité très au sérieux. Tous les profils sont vérifiés et nous avons mis en place des systèmes de signalement et de modération.',
    },
    {
      question: i18n.language === 'en' ? 'Can I choose my activities?' : 'Puis-je choisir mes activités ?',
      answer: i18n.language === 'en' ? 'Absolutely! You can filter groups by your interests and choose the activities that appeal to you most.' : 'Absolument ! Vous pouvez filtrer les groupes selon vos centres d\'intérêt et choisir les activités qui vous attirent le plus.',
    },
  ];
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          {i18n.language === 'en' ? 'Frequently asked questions' : 'Questions fréquentes'}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          On répond franchement, sans détour. Comme on aime chez Random !
        </p>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index} className="border-b-muted/50 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
              <AccordionTrigger className="text-left text-sm sm:text-base hover:no-underline py-3 sm:py-4 font-semibold hover:text-primary transition-colors duration-300">
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
