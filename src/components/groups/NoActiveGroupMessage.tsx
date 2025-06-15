
import { Button } from '@/components/ui/button';
import { Users2, ArrowLeft } from 'lucide-react';

interface NoActiveGroupMessageProps {
  onBack: () => void;
}

const NoActiveGroupMessage = ({ onBack }: NoActiveGroupMessageProps) => {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users2 className="h-10 w-10 text-amber-600" />
      </div>
      <h3 className="text-xl font-heading font-bold text-neutral-800 mb-3">
        Aucun groupe actif
      </h3>
      <p className="text-base text-neutral-600 font-body mb-6 max-w-lg mx-auto">
        Vous devez d'abord rejoindre un groupe d'aventure pour accéder à cette section.
      </p>
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 max-w-sm mx-auto mb-6">
        <p className="text-amber-800 font-medium text-sm">
          💡 Retournez au tableau de bord pour créer ou rejoindre une aventure
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onBack}
        className="text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>
    </div>
  );
};

export default NoActiveGroupMessage;
