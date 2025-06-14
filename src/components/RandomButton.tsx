
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const RandomButton = () => {
  const { joinRandomGroup, loading } = useGroups();
  const [isRolling, setIsRolling] = useState(false);

  const handleRandomClick = async () => {
    setIsRolling(true);
    
    // Animation du dé qui roule
    setTimeout(async () => {
      const success = await joinRandomGroup();
      setIsRolling(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center space-y-8 p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-amber-200/50 shadow-2xl hover:shadow-3xl transition-all duration-300">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <h2 className="text-3xl font-heading font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Prêt pour l'Aventure ?
          </h2>
          <Sparkles className="h-6 w-6 text-amber-500" />
        </div>
        <p className="text-gray-600 text-lg">
          Un clic, un groupe de 5, un bar mystère. C'est parti !
        </p>
      </div>

      <div className="relative">
        <Button
          onClick={handleRandomClick}
          disabled={loading || isRolling}
          size="lg"
          className={`
            bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 
            text-white px-16 py-8 text-2xl font-bold rounded-full
            transition-all duration-300 transform shadow-2xl
            ${isRolling ? 'animate-pulse scale-110 shadow-amber-300/50' : 'hover:scale-105 shadow-amber-500/25'}
          `}
        >
          <Dice6 
            className={`mr-4 h-10 w-10 ${isRolling ? 'animate-spin' : ''}`} 
          />
          {isRolling ? 'Lancement des dés...' : 'RANDOM !'}
        </Button>
        
        {isRolling && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 opacity-20 animate-ping"></div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">5 Personnes</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Instant</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg">
            <Dice6 className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">100% Random</span>
        </div>
      </div>
    </div>
  );
};

export default RandomButton;
