import step1 from "@/assets/step-1.png";
import step2 from "@/assets/step-2.png";
import step3 from "@/assets/step-3.png";
import { useTranslation } from 'react-i18next';
const NoMoreSection = () => {
  const {
    t
  } = useTranslation();
  return <section className="py-16 sm:py-20 md:py-32 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 dark:from-red-800 dark:via-red-900 dark:to-black text-white relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
      backgroundSize: '40px 40px'
    }}></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-6xl">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold mb-8 sm:mb-10 animate-slide-in-up drop-shadow-lg text-white dark:text-neutral-100">
          {t('no_more.title')}
        </h2>
        <div className="mb-12 sm:mb-16 max-w-5xl mx-auto space-y-5 sm:space-y-6">
          <div className="glass-enhanced bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md animate-slide-in-up border border-white/20" style={{
          animationDelay: '0.1s'
        }}>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white dark:text-neutral-100 drop-shadow-md">{t('no_more.beta_status')}</h3>
            <p className="text-base sm:text-lg opacity-95 leading-relaxed text-white dark:text-neutral-200">
              {t('no_more.beta_desc')}
            </p>
          </div>
          <div className="glass-enhanced bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md animate-slide-in-up border border-white/20" style={{
          animationDelay: '0.2s'
        }}>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white dark:text-neutral-100 drop-shadow-md">{t('no_more.evening_status')}</h3>
            <p className="text-base sm:text-lg opacity-95 leading-relaxed text-white dark:text-neutral-200">
              {t('no_more.evening_desc')}
            </p>
          </div>
          <div className="glass-enhanced bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md animate-slide-in-up border border-white/20" style={{
          animationDelay: '0.3s'
        }}>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 text-white dark:text-neutral-100 drop-shadow-md">{t('no_more.community_status')}</h3>
            <p className="text-base sm:text-lg opacity-95 leading-relaxed text-white dark:text-neutral-200">
              {t('no_more.community_desc')}
            </p>
          </div>
        </div>
        
      </div>
    </section>;
};
export default NoMoreSection;