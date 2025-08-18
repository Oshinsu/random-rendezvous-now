
import step1 from "@/assets/step-1.png";
import step2 from "@/assets/step-2.png";
import step3 from "@/assets/step-3.png";
import { useTranslation } from 'react-i18next';

const NoMoreSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-4 sm:mb-6">
          {t('no_more.title')}
        </h2>
        <div className="mb-8 sm:mb-10 max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="bg-background/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-accent">{t('no_more.beta_status')}</h3>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              {t('no_more.beta_desc')}
            </p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-accent">{t('no_more.evening_status')}</h3>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              {t('no_more.evening_desc')}
            </p>
          </div>
          <div className="bg-background/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-accent">{t('no_more.community_status')}</h3>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              {t('no_more.community_desc')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `0ms`}}>
            <img src={step1} alt={t('no_more.feature1_title')} className="w-32 h-40 sm:w-40 sm:h-48 object-cover rounded-lg mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('no_more.feature1_title')}</h3>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{t('no_more.feature1_desc')}</p>
          </div>
          <div className="p-4 sm:p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `150ms`}}>
            <img src={step2} alt={t('no_more.feature2_title')} className="w-32 h-40 sm:w-40 sm:h-48 object-cover rounded-lg mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('no_more.feature2_title')}</h3>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{t('no_more.feature2_desc')}</p>
          </div>
          <div className="p-4 sm:p-6 bg-background/10 rounded-xl backdrop-blur-sm animate-fade-in hover:bg-background/20 transition-all duration-300 group" style={{animationDelay: `300ms`}}>
            <img src={step3} alt={t('no_more.feature3_title')} className="w-32 h-40 sm:w-40 sm:h-48 object-cover rounded-lg mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{t('no_more.feature3_title')}</h3>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{t('no_more.feature3_desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoMoreSection;
