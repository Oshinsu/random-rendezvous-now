import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles, Zap, Star, Target, MapPin, Navigation } from 'lucide-react';
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups';

interface RandomButtonProps {
  size?: 'sm' | 'lg';
}

const iconSizes = {
  sm: 18,
  lg: 32,
};

const RandomButton = ({ size = 'lg' }: RandomButtonProps) => {
  const { joinRandomGroup, loading, userLocation } = useUnifiedGroups();
  const [isRolling, setIsRolling] = useState(false);
  const isCompact = size === 'sm';

  const handleRandomClick = async () => {
    if (loading || isRolling) {
      console.log('🚫 Bouton désactivé - loading:', loading, 'rolling:', isRolling);
      return;
    }
    console.log('🎲 NOUVEAU GROUPE FRAIS - Démarrage du processus complet');
    setIsRolling(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const success = await joinRandomGroup();
      console.log('✅ Résultat création groupe frais:', success);
    } catch (error) {
      console.error('❌ Erreur dans handleRandomClick:', error);
    } finally {
      setIsRolling(false);
    }
  };

  const isDisabled = loading || isRolling;

  // Classes dynamiques/tailwind compact et large
  const sectionClass = isCompact 
    ? "space-y-4 px-2 py-3 card-modern max-w-2xl mx-auto" 
    : "flex flex-col items-center space-y-10 p-10 card-modern max-w-4xl mx-auto";
  const titleClass = isCompact
    ? "font-display text-lg font-bold text-neutral-800 flex items-center justify-center gap-2"
    : "font-display text-5xl font-bold text-neutral-800 flex items-center justify-center gap-4";
  const descClass = isCompact
    ? "font-body text-neutral-600 text-xs font-medium leading-normal"
    : "font-body text-neutral-600 text-xl max-w-2xl font-medium leading-relaxed";
  const geoClass = isCompact
    ? "flex items-center justify-center space-x-1 p-2 glass-card rounded-xl border border-neutral-200/50 text-xs"
    : "flex items-center justify-center space-x-3 p-4 glass-card rounded-2xl border border-neutral-200/50";
  const btnClass = isCompact
    ? "px-5 py-2 text-base font-heading font-bold rounded-2xl shadow-strong min-h-0 h-9"
    : "px-16 py-8 text-2xl font-heading font-bold rounded-3xl shadow-strong";
  const iconSize = isCompact ? iconSizes.sm : iconSizes.lg;

  return (
    <div className={sectionClass}>
      <div className="text-center" style={isCompact ? {marginBottom: 0} : {}}>
        <h2 className={titleClass}>
          <div className={isCompact
            ? "p-1.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow"
            : "p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg"}>
            <Zap size={iconSize} className="text-white animate-glow" />
          </div>
          <span>{isCompact ? "Groupe Frais" : "Nouveau Groupe Frais"}</span>
          <div className={isCompact
            ? "p-1.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow"
            : "p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg"}>
            <Zap size={iconSize} className="text-white animate-glow" />
          </div>
        </h2>
        <p className={descClass}>
          {isCompact
            ? "Créez un groupe totalement frais de 5 aventuriers près de votre position actuelle."
            : "Créez un groupe totalement frais de 5 aventuriers près de votre position actuelle et découvrez ensemble un lieu secret de votre région."
          }
        </p>
        <div className={geoClass}>
          <div className={isCompact
            ? "p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded"
            : "p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg"}>
            <Navigation size={iconSize - 4} className="text-white" />
          </div>
          <span className="font-heading font-semibold text-neutral-700">
            {userLocation 
              ? `Position: ${userLocation.locationName}`
              : 'Cliquez pour localiser et démarrer'
            }
          </span>
        </div>
      </div>

      <Button
        onClick={handleRandomClick}
        disabled={isDisabled}
        size={isCompact ? "sm" : "lg"}
        className={btnClass + ` ${
          isRolling 
            ? 'scale-105 animate-glow shadow-glow-strong'
            : isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-105 hover:shadow-glow-strong active:scale-95'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Dice6 
            size={iconSize - 2}
            className={`text-white ${isRolling ? 'animate-spin' : isDisabled ? '' : 'group-hover:rotate-12'} transition-transform duration-500`} 
          />
          <span className="text-white whitespace-nowrap text-xs md:text-base">
            {isRolling ? 'Recherche position...' : loading ? 'Création groupe...' : 'GROUPE FRAIS'}
          </span>
          <Sparkles size={iconSize - 4} className={`text-white ${isRolling ? 'animate-pulse' : ''}`} />
        </div>
      </Button>

      <div className={isCompact 
        ? "grid grid-cols-3 gap-2 w-full mt-2"
        : "grid grid-cols-3 gap-8 w-full"}
      >
        <div className={isCompact 
          ? "flex flex-col items-center space-y-2 p-3 glass-card rounded-xl border border-blue-200/60 hover:border-blue-400 transition-all duration-500 hover:scale-105 shadow"
          : "flex flex-col items-center space-y-4 p-8 glass-card rounded-3xl border-2 border-blue-200/60 hover:border-blue-400 transition-all duration-500 hover:scale-105 shadow-medium hover:shadow-strong"}
        >
          <div className={isCompact
            ? "p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow"
            : "p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-medium"}>
            <Users size={iconSize} className="text-white" />
          </div>
          <span className={isCompact ? "text-xl font-display font-bold text-blue-600" : "text-4xl font-display font-bold text-blue-600"}>5</span>
          <span className={isCompact ? "font-heading font-semibold text-neutral-600 text-xs" : "font-heading font-semibold text-neutral-600"}>Aventuriers</span>
        </div>
        
        <div className={isCompact 
          ? "flex flex-col items-center space-y-2 p-3 glass-card rounded-xl border border-emerald-200/60 hover:border-emerald-400 transition-all duration-500 hover:scale-105 shadow"
          : "flex flex-col items-center space-y-4 p-8 glass-card rounded-3xl border-2 border-emerald-200/60 hover:border-emerald-400 transition-all duration-500 hover:scale-105 shadow-medium hover:shadow-strong"}
        >
          <div className={isCompact
            ? "p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow"
            : "p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-medium"}>
            <Clock size={iconSize} className="text-white" />
          </div>
          <span className={isCompact ? "text-xl font-display font-bold text-emerald-600" : "text-4xl font-display font-bold text-emerald-600"}>FRAIS</span>
          <span className={isCompact ? "font-heading font-semibold text-neutral-600 text-xs" : "font-heading font-semibold text-neutral-600"}>100% Nouveau</span>
        </div>
        
        <div className={isCompact 
          ? "flex flex-col items-center space-y-2 p-3 glass-card rounded-xl border border-purple-200/60 hover:border-purple-400 transition-all duration-500 hover:scale-105 shadow"
          : "flex flex-col items-center space-y-4 p-8 glass-card rounded-3xl border-2 border-purple-200/60 hover:border-purple-400 transition-all duration-500 hover:scale-105 shadow-medium hover:shadow-strong"}
        >
          <div className={isCompact
            ? "p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow"
            : "p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-medium"}>
            <Target size={iconSize} className="text-white" />
          </div>
          <span className={isCompact ? "text-xl font-display font-bold text-purple-600" : "text-4xl font-display font-bold text-purple-600"}>
            {userLocation ? 'LOCAL' : 'FRESH'}
          </span>
          <span className={isCompact ? "font-heading font-semibold text-neutral-600 text-xs" : "font-heading font-semibold text-neutral-600"}>
            {userLocation ? 'Géolocalisé' : 'Totalement neuf'}
          </span>
        </div>
      </div>
      
      {isDisabled && !isRolling && (
        <div className={isCompact
          ? "flex items-center space-x-2 text-brand-700 glass-card px-3 py-2 rounded-xl border border-brand-200 shadow"
          : "flex items-center space-x-4 text-brand-700 glass-card px-8 py-4 rounded-3xl border border-brand-200 shadow-medium"
        }>
          <div className={isCompact
            ? "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            : "w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"
          }></div>
          <span className={isCompact ? "font-heading font-semibold text-xs" : "font-heading font-semibold text-lg"}>
            Traitement...
          </span>
        </div>
      )}

      <div className={isCompact ? "text-center space-y-1 mt-2" : "text-center space-y-3 mt-6"}>
        <div className={isCompact
          ? "flex items-center justify-center gap-2 font-heading font-semibold text-neutral-600 text-xs"
          : "flex items-center justify-center gap-6 font-heading font-semibold text-neutral-600"
        }>
          <span className="flex items-center gap-1">
            <div className={isCompact
              ? "p-0.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded"
              : "p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded"}>
              <Star size={isCompact ? 14 : 20} className="text-white" />
            </div>
            Nettoyage
          </span>
          <span className="flex items-center gap-1">
            <div className={isCompact
              ? "p-0.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded"
              : "p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded"}>
              <MapPin size={isCompact ? 14 : 20} className="text-white" />
            </div>
            Géolocalisation
          </span>
          <span className="flex items-center gap-1">
            <div className={isCompact
              ? "p-0.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded"
              : "p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded"}>
              <Users size={isCompact ? 14 : 20} className="text-white" />
            </div>
            Création
          </span>
        </div>
        <p className={isCompact ? "font-body text-neutral-500 text-xs" : "font-body text-neutral-500"}>
          {isCompact 
            ? "Groupes 100% frais créés à votre position actuelle" 
            : "Chaque groupe est 100% frais et créé spécialement pour votre position actuelle"
          }
        </p>
        <div className={isCompact 
          ? "inline-flex items-center px-2 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full text-xs font-semibold text-emerald-800"
          : "inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full font-semibold text-emerald-800"
        }>
          <Sparkles size={isCompact ? 12 : 16} className="mr-1" />
          Données toujours fraîches garanties
        </div>
      </div>
    </div>
  );
};

export default RandomButton;
