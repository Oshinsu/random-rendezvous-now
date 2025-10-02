import { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dice6, Users, Clock, Sparkles, Zap, Star, Target, MapPin, Navigation } from 'lucide-react';
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

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
  const [processStep, setProcessStep] = useState<'idle' | 'cleaning' | 'locating' | 'creating' | 'success'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const isCompact = size === 'sm';
  const controls = useAnimation();
  const { ref, isVisible } = useScrollAnimation(0.2);

  const handleRandomClick = async () => {
    if (loading || isRolling) {
      console.log('🚫 Bouton désactivé - loading:', loading, 'rolling:', isRolling);
      return;
    }
    console.log('🎲 NOUVEAU GROUPE FRAIS - Démarrage du processus complet');
    setIsRolling(true);
    
    try {
      // Animation sequence
      setProcessStep('cleaning');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setProcessStep('locating');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setProcessStep('creating');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const success = await joinRandomGroup();
      console.log('✅ Résultat création groupe frais:', success);
      
      if (success) {
        setProcessStep('success');
        setShowConfetti(true);
        await controls.start({
          scale: [1, 1.2, 1],
          rotate: [0, 360],
          transition: { duration: 0.6, ease: "easeOut" }
        });
        setTimeout(() => setShowConfetti(false), 2000);
      }
    } catch (error) {
      console.error('❌ Erreur dans handleRandomClick:', error);
    } finally {
      setIsRolling(false);
      setTimeout(() => setProcessStep('idle'), 500);
    }
  };

  useEffect(() => {
    if (isVisible) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [isVisible, controls]);

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

  // Animation variants
  const buttonVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { 
      scale: 1.05, 
      rotate: [0, -2, 2, 0],
      boxShadow: "0 0 30px rgba(251, 191, 36, 0.4)",
      transition: { 
        rotate: { duration: 0.5, repeat: Infinity },
        scale: { duration: 0.2 }
      }
    },
    tap: { scale: 0.95, rotate: -5 },
    rolling: {
      scale: [1, 1.1, 1.05, 1.1, 1],
      rotate: [0, 180, 360],
      boxShadow: [
        "0 0 20px rgba(251, 191, 36, 0.3)",
        "0 0 40px rgba(251, 191, 36, 0.6)",
        "0 0 20px rgba(251, 191, 36, 0.3)"
      ],
      transition: {
        duration: 1.2,
        repeat: Infinity
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.5
      }
    }),
    hover: {
      scale: 1.08,
      y: -5,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
      transition: { duration: 0.3 }
    }
  };

  const progressValue = {
    idle: 0,
    cleaning: 0.33,
    locating: 0.66,
    creating: 1,
    success: 1
  }[processStep];

  const Confetti = () => (
    <AnimatePresence>
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: "50%",
                y: "50%",
                opacity: 1,
                scale: 0
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                opacity: 0,
                scale: 1,
                rotate: Math.random() * 360
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: i * 0.03
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899'][i % 4]
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={controls}
      className={sectionClass + " relative"}
    >
      <Confetti />
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

      <motion.div className="relative">
        {/* Progress Ring */}
        {isRolling && (
          <motion.svg
            className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)]"
            viewBox="0 0 100 100"
          >
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ 
                pathLength: progressValue,
                rotate: -90
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{
                transformOrigin: "50% 50%",
                filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))"
              }}
            />
          </motion.svg>
        )}
        
        <motion.div
          variants={buttonVariants}
          initial="idle"
          animate={isRolling ? "rolling" : "idle"}
          whileHover={!isDisabled ? "hover" : undefined}
          whileTap={!isDisabled ? "tap" : undefined}
        >
          <Button
            onClick={handleRandomClick}
            disabled={isDisabled}
            size={isCompact ? "sm" : "lg"}
            className={btnClass + " relative overflow-hidden"}
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 0.8, repeat: isRolling ? Infinity : 0, ease: "linear" }}
              >
                <Dice6 size={iconSize - 2} className="text-white" />
              </motion.div>
              <span className="text-white whitespace-nowrap text-xs md:text-base">
                {isRolling ? 'Création...' : loading ? 'Chargement...' : 'GROUPE FRAIS'}
              </span>
              <motion.div
                animate={isRolling ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 0.8, repeat: isRolling ? Infinity : 0 }}
              >
                <Sparkles size={iconSize - 4} className="text-white" />
              </motion.div>
            </div>
          </Button>
        </motion.div>
      </motion.div>

      <div className={isCompact 
        ? "grid grid-cols-3 gap-2 w-full mt-2"
        : "grid grid-cols-3 gap-8 w-full"}
      >
        {[
          { icon: Users, value: "5", label: "Aventuriers", color: "blue" },
          { icon: Clock, value: "FRAIS", label: "100% Nouveau", color: "emerald" },
          { icon: Target, value: userLocation ? 'LOCAL' : 'FRESH', label: userLocation ? 'Géolocalisé' : 'Totalement neuf', color: "purple" }
        ].map((card, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            whileHover="hover"
            className={isCompact 
              ? `flex flex-col items-center space-y-2 p-3 glass-card rounded-xl border border-${card.color}-200/60 shadow`
              : `flex flex-col items-center space-y-4 p-8 glass-card rounded-3xl border-2 border-${card.color}-200/60 shadow-medium`}
          >
            <motion.div 
              className={isCompact
                ? "p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow"
                : "p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-medium"}
              animate={processStep === 'success' && i === 0 ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.6 }}
            >
              <card.icon size={iconSize} className="text-white" />
            </motion.div>
            <motion.span 
              className={isCompact ? `text-xl font-display font-bold text-${card.color}-600` : `text-4xl font-display font-bold text-${card.color}-600`}
              animate={processStep === 'success' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {card.value}
            </motion.span>
            <span className={isCompact ? "font-heading font-semibold text-neutral-600 text-xs" : "font-heading font-semibold text-neutral-600"}>
              {card.label}
            </span>
          </motion.div>
        ))}
      </div>

      {isDisabled && (
        <div className={isCompact
          ? "flex items-center space-x-2 text-brand-700 glass-card px-3 py-2 rounded-xl border border-brand-200 shadow"
          : "flex items-center space-x-4 text-brand-700 glass-card px-8 py-4 rounded-3xl border border-brand-200 shadow-medium"
        }>
          <div className={isCompact
            ? "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            : "w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"
          }></div>
          <span className={isCompact ? "font-heading font-semibold text-xs" : "font-heading font-semibold text-lg"}>
            {isRolling ? 'Création groupe frais...' : 'Traitement...'}
          </span>
        </div>
      )}

      <div className={isCompact ? "text-center space-y-1 mt-2" : "text-center space-y-3 mt-6"}>
        <div className={isCompact
          ? "flex items-center justify-center gap-2 font-heading font-semibold text-neutral-600 text-xs"
          : "flex items-center justify-center gap-6 font-heading font-semibold text-neutral-600"
        }>
          {[
            { icon: Star, label: 'Nettoyage', step: 'cleaning' },
            { icon: MapPin, label: 'Géolocalisation', step: 'locating' },
            { icon: Users, label: 'Création', step: 'creating' }
          ].map((item, i) => (
            <motion.span 
              key={i}
              className="flex items-center gap-1"
              animate={{
                scale: processStep === item.step ? [1, 1.15, 1] : 1,
                color: processStep === item.step ? '#f59e0b' : '#525252'
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className={isCompact
                  ? "p-0.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded"
                  : "p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded"}
                animate={{
                  scale: processStep === item.step ? [1, 1.2, 1] : 1,
                  boxShadow: processStep === item.step 
                    ? '0 0 20px rgba(251, 191, 36, 0.6)' 
                    : '0 0 0px rgba(0, 0, 0, 0)'
                }}
                transition={{ duration: 0.4, repeat: processStep === item.step ? Infinity : 0 }}
              >
                <item.icon size={isCompact ? 14 : 20} className="text-white" />
              </motion.div>
              {item.label}
            </motion.span>
          ))}
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
    </motion.div>
  );
};

export default RandomButton;
