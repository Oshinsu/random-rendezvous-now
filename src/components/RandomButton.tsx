
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles, Zap } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const RandomButton = () => {
  const { joinRandomGroup, loading } = useGroups();
  const [isRolling, setIsRolling] = useState(false);

  const handleRandomClick = async () => {
    console.log('Random button clicked');
    setIsRolling(true);
    
    // Animation du dé qui roule
    setTimeout(async () => {
      try {
        const success = await joinRandomGroup();
        console.log('Join group result:', success);
      } catch (error) {
        console.error('Error in handleRandomClick:', error);
      } finally {
        setIsRolling(false);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-8 bg-gradient-to-br from-white to-amber-50 rounded-3xl border-2 border-amber-200 shadow-xl hover:shadow-2xl transition-all duration-500">
      {/* Header avec animation */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
          <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 bg-clip-text text-transparent font-heading">
            Aventure Random
          </h2>
          <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
        </div>
        <p className="text-gray-700 text-xl font-medium">
          Rejoins un groupe de 5 et découvre ton bar mystère !
        </p>
      </div>

      {/* Bouton principal avec animation améliorée */}
      <div className="relative">
        <Button
          onClick={handleRandomClick}
          disabled={loading || isRolling}
          size="lg"
          className={`
            relative overflow-hidden
            bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 
            hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 
            text-white px-20 py-10 text-3xl font-bold rounded-full
            transition-all duration-300 transform shadow-2xl
            border-4 border-white
            ${isRolling 
              ? 'animate-pulse scale-110 shadow-amber-400/60' 
              : 'hover:scale-105 shadow-amber-500/30 hover:shadow-amber-600/40'
            }
          `}
        >
          {/* Animation de fond pendant le chargement */}
          {isRolling && (
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 opacity-50 animate-pulse"></div>
          )}
          
          <div className="relative flex items-center space-x-4">
            <Dice6 
              className={`h-12 w-12 ${isRolling ? 'animate-spin' : ''}`} 
            />
            <span className="font-heading">
              {isRolling ? 'Recherche en cours...' : 'LANCE TOI !'}
            </span>
            <Zap className="h-8 w-8" />
          </div>
        </Button>
        
        {/* Effet de brillance */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 -skew-x-12 animate-pulse"></div>
      </div>

      {/* Stats visuelles améliorées */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-2xl shadow-lg border border-amber-100 hover:shadow-xl transition-all duration-300">
          <div className="p-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-blue-700">5</span>
            <p className="text-sm font-medium text-gray-600">Personnes</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-2xl shadow-lg border border-amber-100 hover:shadow-xl transition-all duration-300">
          <div className="p-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-green-700">2h</span>
            <p className="text-sm font-medium text-gray-600">Pour se voir</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-3 p-4 bg-white rounded-2xl shadow-lg border border-amber-100 hover:shadow-xl transition-all duration-300">
          <div className="p-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl shadow-lg">
            <Dice6 className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-purple-700">100%</span>
            <p className="text-sm font-medium text-gray-600">Random</p>
          </div>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {(loading || isRolling) && (
        <div className="flex items-center space-x-2 text-amber-600">
          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">Magie en cours...</span>
        </div>
      )}
    </div>
  );
};

export default RandomButton;
