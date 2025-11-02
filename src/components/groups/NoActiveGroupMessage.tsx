
import { Button } from '@/components/ui/button';
import { Users2, ArrowLeft } from 'lucide-react';

interface NoActiveGroupMessageProps {
  onBack: () => void;
}

const NoActiveGroupMessage = ({ onBack }: NoActiveGroupMessageProps) => {
  
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
        <Users2 className="h-10 w-10 text-brand-600" />
      </div>
      <h3 className="text-xl font-heading font-bold text-neutral-800 mb-3">
        🎲 Aucun groupe actif
      </h3>
      <p className="text-base text-neutral-600 font-body mb-6 max-w-lg mx-auto">
        Retourne au <strong>Dashboard</strong> pour lancer une nouvelle aventure !
      </p>
      <div className="bg-gradient-to-br from-brand-50 to-orange-50 border border-brand-200 rounded-2xl p-5 max-w-sm mx-auto mb-8 shadow-soft">
        <p className="text-brand-800 font-medium text-sm">
          💡 <strong>Astuce :</strong> Une fois ton groupe formé, tu peux fermer l'app. On te notifie quand c'est prêt !
        </p>
      </div>
      <Button
        onClick={onBack}
        className="bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-medium hover:scale-102 transition-all duration-300"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au Dashboard
      </Button>
    </div>
  );
};

export default NoActiveGroupMessage;
