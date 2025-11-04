import step1 from "@/assets/step-1.png";
import step2 from "@/assets/step-2.png";
import step3 from "@/assets/step-3.png";
import { useTranslation } from 'react-i18next';
const NoMoreSection = () => {
  const {
    t
  } = useTranslation();
  return <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-neutral-800 via-neutral-850 to-neutral-900 text-white relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
      backgroundSize: '40px 40px'
    }}></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-6xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold mb-6 sm:mb-8 animate-slide-in-up filter drop-shadow-lg text-white">
          {t('no_more.title')}
        </h2>
        <div className="mb-10 sm:mb-12 max-w-5xl mx-auto space-y-4 sm:space-y-5">
          <div className="glass-enhanced bg-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md animate-slide-in-up border border-white/20" style={{
          animationDelay: '0.1s'
        }}>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-white filter drop-shadow-md">{t('no_more.beta_status')}</h3>
            <p className="text-sm sm:text-base opacity-95 leading-relaxed text-white">
              {t('no_more.beta_desc')}
            </p>
          </div>
          <div className="glass-enhanced bg-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md animate-slide-in-up border border-white/20" style={{
          animationDelay: '0.2s'
        }}>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-white filter drop-shadow-md">{t('no_more.evening_status')}</h3>
            <p className="text-sm sm:text-base opacity-95 leading-relaxed text-white">
              {t('no_more.evening_desc')}
            </p>
          </div>
          <div className="glass-enhanced bg-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md animate-slide-in-up border border-white/20" style={{
          animationDelay: '0.3s'
        }}>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-white filter drop-shadow-md">{t('no_more.community_status')}</h3>
            <p className="text-sm sm:text-base opacity-95 leading-relaxed text-white">
              {t('no_more.community_desc')}
            </p>
          </div>
        </div>
        
      </div>
    </section>;
};
export default NoMoreSection;