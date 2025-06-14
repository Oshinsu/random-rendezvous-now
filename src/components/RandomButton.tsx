
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const RandomButton = () => {
  const { joinRandomGroup, loading } = useGroups();
  const [isRolling, setIsRolling] = useState(false);

  const handleRandomClick = async () => {
    console.log('Random button clicked');
    setIsRolling(true);
    
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
    <div className="flex flex-col items-center space-y-8 p-8 glass-effect rounded-2xl shadow-lg max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">
          Aventure Aléatoire
        </h2>
        <p className="text-gray-600 text-lg">
          Rejoins un groupe de 5 et découvre un bar parisien
        </p>
      </div>

      <Button
        onClick={handleRandomClick}
        disabled={loading || isRolling}
        size="lg"
        className={`
          gold-gradient text-white px-12 py-6 text-xl font-semibold rounded-full
          transition-all duration-300 transform
          ${isRolling 
            ? 'scale-105 animate-pulse' 
            : 'hover:scale-105 shadow-lg hover:shadow-xl'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <Dice6 
            className={`h-6 w-6 ${isRolling ? 'animate-spin' : ''}`} 
          />
          <span>
            {isRolling ? 'Recherche...' : 'Lancer'}
          </span>
          <Sparkles className="h-5 w-5" />
        </div>
      </Button>

      <div className="grid grid-cols-3 gap-6 w-full">
        <div className="flex flex-col items-center space-y-2 p-4 glass-effect rounded-xl">
          <Users className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">5</span>
          <span className="text-sm text-gray-600">Membres</span>
        </div>
        
        <div className="flex flex-col items-center space-y-2 p-4 glass-effect rounded-xl">
          <Clock className="h-8 w-8 text-emerald-600" />
          <span className="text-2xl font-bold text-emerald-600">2h</span>
          <span className="text-sm text-gray-600">Délai</span>
        </div>
        
        <div className="flex flex-col items-center space-y-2 p-4 glass-effect rounded-xl">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <span className="text-2xl font-bold text-purple-600">100%</span>
          <span className="text-sm text-gray-600">Surprise</span>
        </div>
      </div>

      {(loading || isRolling) && (
        <div className="flex items-center space-x-3 text-gold">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">Recherche en cours...</span>
        </div>
      )}
    </div>
  );
};

export default RandomButton;
