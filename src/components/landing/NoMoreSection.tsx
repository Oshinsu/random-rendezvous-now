import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const NoMoreSection = () => {
  const { t } = useTranslation();

  const nopes = [
    {
      label: t('no_more.feature1_title', 'Exit le Swipe Sans Fin'),
      desc: t('no_more.feature1_desc', 'Le hasard choisit pour toi. Plus de scroll infini, plus d\'angoisse du choix.'),
      tilt: '-rotate-1',
      offset: 'translate-y-0',
    },
    {
      label: t('no_more.feature2_title', 'Fini les Profils Bidons'),
      desc: t('no_more.feature2_desc', 'On se découvre en vrai, sans filtre ni mise en scène.'),
      tilt: 'rotate-1',
      offset: 'translate-y-2',
    },
    {
      label: t('no_more.feature3_title', 'Bye le "Salut ça va ?"'),
      desc: t('no_more.feature3_desc', 'Vous arrivez au même bar. La conversation démarre toute seule.'),
      tilt: '-rotate-0.5',
      offset: '-translate-y-1',
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-neutral-50 via-white to-amber-50/20 relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-5xl">
        {/* Titre avec effet "barré" */}
        <div className="text-center mb-10 sm:mb-14 animate-slide-in-up">
          <div className="inline-flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-widest mb-3">
            <div className="w-8 h-px bg-neutral-300"></div>
            <span>On jette tout ça à la poubelle</span>
            <div className="w-8 h-px bg-neutral-300"></div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-neutral-900">
            {t('no_more.title')}
          </h2>
          <p className="text-neutral-500 text-sm sm:text-base mt-2 italic">
            {t('no_more.subtitle', 'Exit les applis de rencontres classiques')}
          </p>
        </div>

        {/* Cards chaotiques avec légère rotation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-12 sm:mb-14">
          {nopes.map((item, i) => (
            <div
              key={i}
              className={`group relative bg-white rounded-2xl p-6 shadow-medium border border-neutral-100 hover:shadow-strong transition-all duration-300 cursor-default ${item.tilt} ${item.offset} hover:rotate-0 hover:translate-y-0`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {/* Croix "non merci" */}
              <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-red-100 border-2 border-white flex items-center justify-center shadow-sm group-hover:bg-red-200 transition-colors">
                <X className="w-3.5 h-3.5 text-red-500" />
              </div>

              {/* Contenu barré style chaos */}
              <p className="text-xs font-bold text-neutral-400 line-through decoration-red-400 decoration-2 uppercase tracking-wider mb-3">
                {item.label}
              </p>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Infos pratiques horizontales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          {[
            { icon: '🚧', title: t('no_more.beta_status', '🚧 Beta en cours'), text: t('no_more.beta_desc', 'Gratuit. On améliore chaque jour.') },
            { icon: '⏰', title: t('no_more.evening_status', '⏰ Créneau magique'), text: t('no_more.evening_desc', '17h–23h. À tout à l\'heure 🌙') },
            { icon: '🌴', title: t('no_more.community_status', '🚀 Martinique · Mars 2026'), text: t('no_more.community_desc', 'On démarre en Martinique. Parlez-en 🌴') },
          ].map((info, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="text-xl flex-shrink-0 mt-0.5">{info.icon}</div>
              <div>
                <div className="font-semibold text-sm text-neutral-800 mb-0.5">{info.title}</div>
                <div className="text-xs text-neutral-500 leading-relaxed">{info.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default NoMoreSection;