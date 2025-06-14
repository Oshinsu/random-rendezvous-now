
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles, Zap } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const RandomButton = () => {
  const { joinRandomGroup, loading } = useGroups();
  const [isRolling, setIsRolling] = useState(false);

  const handleRandomClick = async () => {
    if (loading || isRolling) {
      console.log('🚫 Bouton désactivé - loading:', loading, 'rolling:', isRolling);
      return;
    }
    
    console.log('🎲 Bouton Random cliqué');
    setIsRolling(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = await joinRandomGroup();
      console.log('✅ Résultat rejoindre groupe:', success);
    } catch (error) {
      console.error('❌ Erreur dans handleRandomClick:', error);
    } finally {
      setIsRolling(false);
    }
  };

  const isDisabled = loading || isRolling;

  return (
    <div className="flex flex-col items-center space-y-8 p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-xl max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-slate-800 flex items-center justify-center gap-3 tracking-tight">
          <Zap className="h-10 w-10 text-amber-500" />
          Aventure Aléatoire
          <Zap className="h-10 w-10 text-amber-500" />
        </h2>
        <p className="text-slate-600 text-lg max-w-md font-medium leading-relaxed">
          Rejoins un groupe de 5 personnes et découvre un bar parisien secret en 2 heures !
        </p>
      </div>

      <Button
        onClick={handleRandomClick}
        disabled={isDisabled}
        size="lg"
        className={`
          bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 
          text-white px-12 py-6 text-xl font-semibold rounded-full shadow-lg
          transition-all duration-500 transform
          ${isRolling 
            ? 'scale-110 animate-pulse shadow-2xl' 
            : isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-105 hover:shadow-xl active:scale-95'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <Dice6 
            className={`h-7 w-7 ${isRolling ? 'animate-spin' : isDisabled ? '' : 'group-hover:rotate-12'} transition-transform duration-300`} 
          />
          <span className="font-bold">
            {isRolling ? 'Recherche en cours...' : loading ? 'Chargement...' : 'LANCER L\'AVENTURE'}
          </span>
          <Sparkles className={`h-6 w-6 ${isRolling ? 'animate-pulse' : ''}`} />
        </div>
      </Button>

      <div className="grid grid-cols-3 gap-6 w-full">
        <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-blue-200/60 hover:border-blue-400 transition-all duration-300 shadow-md">
          <Users className="h-10 w-10 text-blue-600" />
          <span className="text-3xl font-bold text-blue-600">5</span>
          <span className="text-sm text-slate-600 font-medium">Membres</span>
        </div>
        
        <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-emerald-200/60 hover:border-emerald-400 transition-all duration-300 shadow-md">
          <Clock className="h-10 w-10 text-emerald-600" />
          <span className="text-3xl font-bold text-emerald-600">2h</span>
          <span className="text-sm text-slate-600 font-medium">Délai</span>
        </div>
        
        <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-purple-200/60 hover:border-purple-400 transition-all duration-300 shadow-md">
          <Sparkles className="h-10 w-10 text-purple-600" />
          <span className="text-3xl font-bold text-purple-600">100%</span>
          <span className="text-sm text-slate-600 font-medium">Surprise</span>
        </div>
      </div>

      {isDisabled && (
        <div className="flex items-center space-x-3 text-amber-700 bg-amber-50 px-6 py-3 rounded-full border border-amber-200">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">
            {isRolling ? 'Recherche du groupe parfait...' : 'Traitement en cours...'}
          </span>
        </div>
      )}

      <div className="text-center space-y-2 mt-4">
        <p className="text-sm text-slate-500 font-medium">
          🎯 Algorithme intelligent pour des rencontres authentiques
        </p>
        <p className="text-xs text-slate-400">
          Plus de 50 bars parisiens dans notre sélection
        </p>
      </div>
    </div>
  );
};

export default RandomButton;
