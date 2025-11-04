import { useTranslation } from 'react-i18next';
const NoMoreSection = () => {
  const {
    t
  } = useTranslation();
  return <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-brand-50/30 via-amber-50/20 to-neutral-50 relative overflow-hidden">
      {/* Decorative patterns */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
      backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)',
      backgroundSize: '40px 40px'
    }}></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-200/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-300/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 text-center relative z-10 max-w-6xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold mb-6 sm:mb-8 animate-slide-in-up filter drop-shadow-sm text-neutral-800">
          {t('no_more.title')}
        </h2>
        <div className="mb-10 sm:mb-12 max-w-5xl mx-auto space-y-4 sm:space-y-5">
          <div className="glass-card rounded-2xl p-5 sm:p-6 backdrop-blur-md animate-slide-in-up border border-neutral-200/50" style={{
          animationDelay: '0.1s'
        }}>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-800">{t('no_more.beta_status')}</h3>
            <p className="text-sm sm:text-base leading-relaxed text-neutral-600">
              {t('no_more.beta_desc')}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-5 sm:p-6 backdrop-blur-md animate-slide-in-up border border-neutral-200/50" style={{
          animationDelay: '0.2s'
        }}>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-800">{t('no_more.evening_status')}</h3>
            <p className="text-sm sm:text-base leading-relaxed text-neutral-600">
              {t('no_more.evening_desc')}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-5 sm:p-6 backdrop-blur-md animate-slide-in-up border border-neutral-200/50" style={{
          animationDelay: '0.3s'
        }}>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-neutral-800">{t('no_more.community_status')}</h3>
            <p className="text-sm sm:text-base leading-relaxed text-neutral-600">
              {t('no_more.community_desc')}
            </p>
          </div>
        </div>
        
      </div>
    </section>;
};
export default NoMoreSection;