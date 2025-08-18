
import { useTranslation } from 'react-i18next';

const LoadingState = () => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h3 className="text-lg font-heading font-semibold text-neutral-800 mb-2">
        {t('loading.title')}
      </h3>
      <p className="text-sm text-neutral-600 font-body">{t('loading.subtitle')}</p>
    </div>
  );
};

export default LoadingState;
