
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles, Zap, Star, Target, MapPin, Navigation } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';

const RandomButton = () => {
  const { joinRandomGroup, loading, userLocation } = useGroups();
  const [isRolling, setIsRolling] = useState(false);

  const handleRandomClick = async () => {
    if (loading || isRolling) {
      console.log('🚫 Bouton désactivé - loading:', loading, 'rolling:', isRolling);
      return;
    }
    
    console.log('🎲 Bouton Random cliqué');
    setIsRolling(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
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
    <div className="flex flex-col items-center space-y-10 p-10 card-modern max-w-4xl mx-auto">
      <div className="text-center space-y-6">
        <h2 className="font-display text-5xl font-bold text-neutral-800 flex items-center justify-center gap-4">
          <Zap className="h-12 w-12 text-brand-500 animate-glow" />
          Aventure Aléatoire
          <Zap className="h-12 w-12 text-brand-500 animate-glow" />
        </h2>
        <p className="font-body text-neutral-600 text-xl max-w-2xl font-medium leading-relaxed">
          Rejoins un groupe de 5 aventuriers et découvre un bar parisien secret en 2 heures !
        </p>
        
        {/* Statut de géolocalisation */}
        <div className="flex items-center justify-center space-x-3 p-4 glass-card rounded-2xl border border-neutral-200/50">
          <Navigation className={`h-6 w-6 ${userLocation ? 'text-emerald-600' : 'text-neutral-400'}`} />
          <span className="font-heading font-semibold text-neutral-700">
            {userLocation 
              ? `📍 Position: ${userLocation.locationName}`
              : '🔍 Géolocalisation indisponible - matching aléatoire'
            }
          </span>
        </div>
      </div>

      <Button
        onClick={handleRandomClick}
        disabled={isDisabled}
        size="lg"
        className={`
          px-16 py-8 text-2xl font-heading font-bold rounded-3xl shadow-strong
          transition-all duration-700 transform
          ${isRolling 
            ? 'scale-110 animate-glow shadow-glow-strong' 
            : isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-110 hover:shadow-glow-strong active:scale-95'
          }
        `}
      >
        <div className="flex items-center space-x-4">
          <Dice6 
            className={`h-8 w-8 ${isRolling ? 'animate-spin' : isDisabled ? '' : 'group-hover:rotate-12'} transition-transform duration-500`} 
          />
          <span>
            {isRolling ? 'Recherche en cours...' : loading ? 'Chargement...' : 'LANCER L\'AVENTURE'}
          </span>
          <Sparkles className={`h-7 w-7 ${isRolling ? 'animate-pulse' : ''}`} />
        </div>
      </Button>

      <div className="grid grid-cols-3 gap-8 w-full">
        <div className="flex flex-col items-center space-y-4 p-8 glass-card rounded-3xl border-2 border-blue-200/60 hover:border-blue-400 transition-all duration-500 hover:scale-105 shadow-medium hover:shadow-strong">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-medium">
            <Users className="h-12 w-12 text-white" />
          </div>
          <span className="text-4xl font-display font-bold text-blue-600">5</span>
          <span className="font-heading font-semibold text-neutral-600">Aventuriers</span>
        </div>
        
        <div className="flex flex-col items-center space-y-4 p-8 glass-card rounded-3xl border-2 border-emerald-200/60 hover:border-emerald-400 transition-all duration-500 hover:scale-105 shadow-medium hover:shadow-strong">
          <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-medium">
            <Clock className="h-12 w-12 text-white" />
          </div>
          <span className="text-4xl font-display font-bold text-emerald-600">2h</span>
          <span className="font-heading font-semibold text-neutral-600">D'aventure</span>
        </div>
        
        <div className="flex flex-col items-center space-y-4 p-8 glass-card rounded-3xl border-2 border-purple-200/60 hover:border-purple-400 transition-all duration-500 hover:scale-105 shadow-medium hover:shadow-strong">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-medium">
            <Target className="h-12 w-12 text-white" />
          </div>
          <span className="text-4xl font-display font-bold text-purple-600">
            {userLocation ? '📍' : '100%'}
          </span>
          <span className="font-heading font-semibold text-neutral-600">
            {userLocation ? 'Géolocalisé' : 'Surprise'}
          </span>
        </div>
      </div>

      {isDisabled && (
        <div className="flex items-center space-x-4 text-brand-700 glass-card px-8 py-4 rounded-3xl border border-brand-200 shadow-medium">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="font-heading font-semibold text-lg">
            {isRolling ? 'Recherche du groupe parfait...' : 'Traitement en cours...'}
          </span>
        </div>
      )}

      <div className="text-center space-y-3 mt-6">
        <div className="flex items-center justify-center gap-6 font-heading font-semibold text-neutral-600">
          <span className="flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-500" />
            Algorithme intelligent
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-500" />
            Matching géolocalisé
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-500" />
            Rencontres authentiques
          </span>
        </div>
        <p className="font-body text-neutral-500">
          Plus de 50 bars parisiens secrets dans notre sélection premium
        </p>
        {userLocation && (
          <p className="font-body text-emerald-600 font-medium">
            🎯 Groupes prioritaires près de {userLocation.locationName}
          </p>
        )}
      </div>
    </div>
  );
};

export default RandomButton;
