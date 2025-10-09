
import step1 from "@/assets/step-1.png";
import step2 from "@/assets/step-2.png";
import step3 from "@/assets/step-3.png";
import { useTranslation } from 'react-i18next';

const NoMoreSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 sm:py-20 md:py-32 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-primary-foreground relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-6xl">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold mb-8 sm:mb-10 animate-slide-in-up drop-shadow-lg">
          {t('no_more.title')}
        </h2>
        <div className="mb-12 sm:mb-16 max-w-5xl mx-auto space-y-5 sm:space-y-6">
          <div className="glass-enhanced bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md animate-slide-in-up border border-white/20" style={{animationDelay: '0.1s'}}>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-md">{t('no_more.beta_status')}</h3>
            <p className="text-base sm:text-lg opacity-95 leading-relaxed">
              {t('no_more.beta_desc')}
            </p>
          </div>
          <div className="glass-enhanced bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md animate-slide-in-up border border-white/20" style={{animationDelay: '0.2s'}}>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-md">{t('no_more.evening_status')}</h3>
            <p className="text-base sm:text-lg opacity-95 leading-relaxed">
              {t('no_more.evening_desc')}
            </p>
          </div>
          <div className="glass-enhanced bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md animate-slide-in-up border border-white/20" style={{animationDelay: '0.3s'}}>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white drop-shadow-md">{t('no_more.community_status')}</h3>
            <p className="text-base sm:text-lg opacity-95 leading-relaxed">
              {t('no_more.community_desc')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bento-card p-6 sm:p-8 glass-enhanced bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 animate-slide-in-up group" style={{animationDelay: '0.4s'}}>
            <img src={step1} alt={t('no_more.feature1_title')} className="w-36 h-44 sm:w-44 sm:h-52 object-cover rounded-2xl mx-auto mb-4 sm:mb-6 shadow-strong group-hover:scale-105 transition-transform duration-300" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 drop-shadow-md">{t('no_more.feature1_title')}</h3>
            <p className="text-sm sm:text-base opacity-95 leading-relaxed">{t('no_more.feature1_desc')}</p>
          </div>
          <div className="bento-card p-6 sm:p-8 glass-enhanced bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 animate-slide-in-up group" style={{animationDelay: '0.5s'}}>
            <img src={step2} alt={t('no_more.feature2_title')} className="w-36 h-44 sm:w-44 sm:h-52 object-cover rounded-2xl mx-auto mb-4 sm:mb-6 shadow-strong group-hover:scale-105 transition-transform duration-300" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 drop-shadow-md">{t('no_more.feature2_title')}</h3>
            <p className="text-sm sm:text-base opacity-95 leading-relaxed">{t('no_more.feature2_desc')}</p>
          </div>
          <div className="bento-card p-6 sm:p-8 glass-enhanced bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 animate-slide-in-up group" style={{animationDelay: '0.6s'}}>
            <img src={step3} alt={t('no_more.feature3_title')} className="w-36 h-44 sm:w-44 sm:h-52 object-cover rounded-2xl mx-auto mb-4 sm:mb-6 shadow-strong group-hover:scale-105 transition-transform duration-300" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 drop-shadow-md">{t('no_more.feature3_title')}</h3>
            <p className="text-sm sm:text-base opacity-95 leading-relaxed">{t('no_more.feature3_desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NoMoreSection;
