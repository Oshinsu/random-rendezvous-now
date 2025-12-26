import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import RandomLogo from '@/components/RandomLogo';

type ButtonState = 'idle' | 'loading' | 'success';

interface Props {
  onSearch: () => Promise<void>;
  isDisabled?: boolean;
  isSearching: boolean;
  currentParticipants?: number;
  className?: string;
}

export function EnhancedSearchButtonV2({ 
  onSearch, 
  isDisabled, 
  isSearching,
  currentParticipants = 0,
  className 
}: Props) {
  const [state, setState] = useState<ButtonState>('idle');
  
  useEffect(() => {
    if (isSearching) {
      setState('loading');
    } else {
      setState('idle');
    }
  }, [isSearching]);
  
  const handleClick = async () => {
    if (state !== 'idle' || isDisabled) return;
    await onSearch();
  };
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Main button */}
      <motion.button
        onClick={handleClick}
        disabled={isDisabled || state !== 'idle'}
        className={cn(
          "relative w-48 h-48 rounded-3xl border-2 border-[#f1c232]/30",
          "shadow-[0_0_60px_rgba(241,194,50,0.4)] hover:shadow-[0_0_80px_rgba(241,194,50,0.6)]",
          "transition-shadow duration-300",
          "focus:outline-none focus:ring-4 focus:ring-[#f1c232]/30",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "gradient-button",
          className
        )}
        whileHover={state === 'idle' ? { scale: 1.05, rotate: 2 } : {}}
        whileTap={state === 'idle' ? { scale: 0.95 } : {}}
      >
        {/* Inner glassmorphism */}
        <div className="absolute inset-4 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/50 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <RandomLogo size={80} animated />
                <p className="mt-3 text-sm font-bold text-[#825c16]">
                  Clique ici
                </p>
              </motion.div>
            )}
            
            {state === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <RandomLogo size={80} />
                </motion.div>
                <p className="mt-3 text-sm font-bold text-[#825c16] animate-pulse">
                  Recherche...
                </p>
                {currentParticipants > 0 && (
                  <motion.span 
                    className="mt-2 text-xs text-[#825c16] bg-white/60 px-3 py-1 rounded-full"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {currentParticipants}/5
                  </motion.span>
                )}
              </motion.div>
            )}
            
            {state === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f1c232] to-[#c08a15] flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(241,194,50,0.5)]">
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </div>
                <p className="text-sm font-bold text-[#825c16]">
                  Groupe trouvé ! 🎉
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Orbital rings (loading only) */}
        <AnimatePresence>
          {state === 'loading' && (
            <>
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-dashed border-[#f1c232]/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-6 rounded-2xl border-2 border-dotted border-[#f1c232]/30"
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.button>
      
      {/* Helper text - NOUVEAU: Texte explicite visible */}
      <motion.p 
        className="text-center mt-6 text-lg text-neutral-600 dark:text-neutral-400 font-medium max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {state === 'idle' && '👆 Un seul clic pour commencer'}
        {state === 'loading' && 'On forme ton groupe de 5...'}
        {state === 'success' && 'Redirection vers ton groupe'}
      </motion.p>
    </div>
  );
}

