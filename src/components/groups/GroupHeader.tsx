
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
          size="sm"
          className={`gap-2 text-xs px-3 h-8 bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow hover:shadow-glow-strong hover:-translate-y-0.5 transition-transform ${loading ? 'animate-pulse' : 'animate-glow'}`}
          aria-label="Relancer la recherche de groupe"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform`} />
          <span>Relancer</span>
        </Button>
      </div>
    </div>
  );
};

export default GroupHeader;
