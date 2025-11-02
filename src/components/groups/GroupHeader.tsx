
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GroupHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
}

const GroupHeader = ({ onBack, onRefresh: _onRefresh, loading: _loading }: GroupHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl p-2 transition-colors"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('groups.back')}
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold text-neutral-800 dark:text-neutral-100">
            {t('groups.header_title')}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-body">
            {t('groups.header_subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupHeader;
