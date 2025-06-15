
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface GroupHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  loading: boolean;
}

const GroupHeader = ({ onBack, onRefresh, loading }: GroupHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-600 hover:text-neutral-800 p-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold text-neutral-800">
            Votre Aventure
          </h1>
          <p className="text-sm text-neutral-600 font-body">
            Suivez l'évolution en temps réel
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="bg-white/50 backdrop-blur-sm border-brand-300 text-brand-700 hover:bg-brand-50 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
    </div>
  );
};

export default GroupHeader;
