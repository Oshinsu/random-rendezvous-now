import { Button } from '@/components/ui/button';
import { Users2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NoActiveGroupMessageProps {
  onBack: () => void;
}

const NoActiveGroupMessage = ({ onBack }: NoActiveGroupMessageProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
        <Users2 className="h-10 w-10 text-brand-600 dark:text-brand-400" />
      </div>
      <h3 className="text-xl font-heading font-bold text-neutral-800 dark:text-neutral-100 mb-3">
        {t('groups.no_group_title')}
      </h3>
      <p 
        className="text-base text-neutral-600 dark:text-neutral-400 font-body mb-6 max-w-lg mx-auto"
        dangerouslySetInnerHTML={{ __html: t('groups.no_group_desc') }}
      />
      <div className="bg-gradient-to-br from-brand-50 to-orange-50 dark:from-neutral-800 dark:to-neutral-700 border border-brand-200 dark:border-neutral-600 rounded-2xl p-5 max-w-sm mx-auto mb-8 shadow-soft">
        <p 
          className="text-brand-800 dark:text-brand-200 font-medium text-sm"
          dangerouslySetInnerHTML={{ __html: t('groups.no_group_tip') }}
        />
      </div>
      <Button
        onClick={onBack}
        className="bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-medium hover:scale-102 transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('groups.back_to_dashboard')}
      </Button>
    </div>
  );
};

export default NoActiveGroupMessage;
