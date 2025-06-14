
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles, Zap, Crown, Star } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const RandomButton = () => {
  const { joinRandomGroup, loading } = useGroups();
  const [isRolling, setIsRolling] = useState(false);

  const handleRandomClick = async () => {
    console.log('Random button clicked - luxury edition');
    setIsRolling(true);
    
    // Animation luxueuse du dé qui roule
    setTimeout(async () => {
      try {
        const success = await joinRandomGroup();
        console.log('Join group result:', success);
      } catch (error) {
        console.error('Error in handleRandomClick:', error);
      } finally {
        setIsRolling(false);
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center space-y-8 p-12 glass-luxury rounded-3xl shadow-2xl hover:shadow-gold transition-all duration-700 luxury-float">
      {/* Header luxueux avec animation */}
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <Crown className="h-12 w-12 text-yellow-600 luxury-shimmer" />
          <h2 className="text-6xl font-luxury font-black bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-700 bg-clip-text text-transparent">
            Aventure Prestigieuse
          </h2>
          <Crown className="h-12 w-12 text-yellow-600 luxury-shimmer" />
        </div>
        <p className="text-gray-800 text-2xl font-elegant font-medium tracking-wide">
          Rejoins un cercle exclusif de 5 et découvre ton établissement de prestige
        </p>
      </div>

      {/* Bouton principal luxueux avec animation avancée */}
      <div className="relative">
        <Button
          onClick={handleRandomClick}
          disabled={loading || isRolling}
          size="lg"
          className={`
            relative overflow-hidden group
            bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 
            hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-700 
            text-white px-24 py-12 text-4xl font-luxury font-bold rounded-full
            transition-all duration-500 transform shadow-2xl
            border-4 border-white
            ${isRolling 
              ? 'animate-pulse scale-110 gold-glow shadow-yellow-400/80' 
              : 'hover:scale-110 shadow-yellow-500/50 hover:shadow-yellow-600/70'
            }
          `}
        >
          {/* Animation de fond luxueuse pendant le chargement */}
          {isRolling && (
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-yellow-600 opacity-70 luxury-shimmer"></div>
          )}
          
          {/* Effet de brillance */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 -skew-x-12 group-hover:animate-pulse"></div>
          
          <div className="relative flex items-center space-x-6 z-10">
            <Dice6 
              className={`h-16 w-16 ${isRolling ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform duration-300`} 
            />
            <span className="font-luxury font-black tracking-wide">
              {isRolling ? 'RECHERCHE EN COURS...' : 'LANCER L\'EXPÉRIENCE'}
            </span>
            <Sparkles className="h-12 w-12 group-hover:animate-pulse" />
          </div>
        </Button>
      </div>

      {/* Stats visuelles premium */}
      <div className="grid grid-cols-3 gap-8 mt-12">
        <div className="flex flex-col items-center space-y-4 p-8 glass-gold rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-lg luxury-shimmer">
            <Users className="h-10 w-10 text-white" />
          </div>
          <div className="text-center">
            <span className="text-4xl font-luxury font-black text-blue-700">5</span>
            <p className="text-lg font-elegant font-semibold text-gray-700 uppercase tracking-wider">Membres Exclusifs</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-4 p-8 glass-gold rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl shadow-lg luxury-shimmer">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <div className="text-center">
            <span className="text-4xl font-luxury font-black text-emerald-700">2h</span>
            <p className="text-lg font-elegant font-semibold text-gray-700 uppercase tracking-wider">Délai Premium</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center space-y-4 p-8 glass-gold rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl shadow-lg luxury-shimmer">
            <Star className="h-10 w-10 text-white" />
          </div>
          <div className="text-center">
            <span className="text-4xl font-luxury font-black text-purple-700">100%</span>
            <p className="text-lg font-elegant font-semibold text-gray-700 uppercase tracking-wider">Expérience Unique</p>
          </div>
        </div>
      </div>

      {/* Indicateur de chargement luxueux */}
      {(loading || isRolling) && (
        <div className="flex items-center space-x-4 text-yellow-700 glass-luxury p-6 rounded-2xl">
          <div className="w-6 h-6 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin gold-glow"></div>
          <span className="font-elegant font-bold text-xl tracking-wide">Magie Premium en cours...</span>
        </div>
      )}
    </div>
  );
};

export default RandomButton;
