import { useTranslation } from "react-i18next";
import { Users, Calendar, Sparkles, MapPin } from "lucide-react";

const StatsSection = () => {
  const { i18n } = useTranslation();

  const stats = [
    {
      icon: Users,
      value: "500+",
      label: i18n.language === 'en' ? 'Active Members' : 'Membres actifs',
    },
    {
      icon: Calendar,
      value: "200+",
      label: i18n.language === 'en' ? 'Groups Created' : 'Groupes créés',
    },
    {
      icon: Sparkles,
      value: "1000+",
      label: i18n.language === 'en' ? 'Connections Made' : 'Connexions créées',
    },
    {
      icon: MapPin,
      value: "50+",
      label: i18n.language === 'en' ? 'Partner Bars' : 'Bars partenaires',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-primary/5 border-y">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center animate-fade-in hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
