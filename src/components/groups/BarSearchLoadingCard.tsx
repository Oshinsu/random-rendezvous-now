import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import RandomLogo from '@/components/RandomLogo';

const LOADING_MESSAGES = [
  "Recherche en cours...",
  "Analyse des meilleures destinations...",
  "Sélection du bar parfait...",
  "Calcul de l'ambiance idéale...",
  "Préparation de votre aventure...",
];

export const BarSearchLoadingCard = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotation des messages toutes les 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Animation de la barre de progression (simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Reste à 95% jusqu'à la vraie assignation
        return prev + Math.random() * 5;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-brand-50 via-amber-50 to-orange-50 border-2 border-brand-300/40 rounded-3xl p-6 sm:p-8 shadow-glow animate-scale-in">
      {/* Header avec logo pulsant */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="animate-pulse-glow">
          <RandomLogo size={56} withAura={true} rounded={true} />
        </div>
        <Loader2 className="h-8 w-8 text-brand-600 animate-spin" />
      </div>

      {/* Message rotatif */}
      <div className="text-center mb-6">
        <h3 className="text-lg sm:text-xl font-heading font-bold text-brand-800 mb-2">
          🍺 Recherche magique en cours
        </h3>
        <p 
          className="text-sm sm:text-base text-brand-700/90 font-medium transition-all duration-300 min-h-[24px]"
          key={messageIndex}
        >
          {LOADING_MESSAGES[messageIndex]}
        </p>
      </div>

      {/* Barre de progression avec shimmer */}
      <div className="relative w-full h-3 bg-brand-200/50 rounded-full overflow-hidden mb-4">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 via-amber-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer bg-[length:200%_100%]" />
        </div>
      </div>

      {/* Durée estimée */}
      <div className="text-center">
        <p className="text-xs text-brand-600/80 font-medium">
          ⏱️ Estimation : 2-8 secondes
        </p>
      </div>

      {/* Points décoratifs animés */}
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0s' }} />
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
};
