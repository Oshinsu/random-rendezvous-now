
import { Button } from '@/components/ui/button';
import { Users2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NoActiveGroupMessageProps {
  onBack: () => void;
}

const NoActiveGroupMessage = ({ onBack }: NoActiveGroupMessageProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users2 className="h-10 w-10 text-amber-600" />
      </div>
      <h3 className="text-xl font-heading font-bold text-neutral-800 mb-3">
        {t('no_group.title')}
      </h3>
      <p className="text-base text-neutral-600 font-body mb-6 max-w-lg mx-auto">
        {t('no_group.subtitle')}
      </p>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 max-w-sm mx-auto mb-6">
        <p className="text-amber-800 font-medium text-sm">
          {t('no_group.tip')}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onBack}
        className="text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('no_group.back')}
      </Button>
    </div>
  );
};

export default NoActiveGroupMessage;
