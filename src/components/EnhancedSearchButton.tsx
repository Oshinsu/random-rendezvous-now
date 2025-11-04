import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import RandomLogo from '@/components/RandomLogo'

type ButtonState = 'idle' | 'loading' | 'success'

interface Props {
  onSearch: () => Promise<void>
  isDisabled?: boolean
  isSearching: boolean
  currentParticipants?: number
  className?: string
}

export function EnhancedSearchButton({ 
  onSearch, 
  isDisabled, 
  isSearching,
  currentParticipants = 0,
  className 
}: Props) {
  const [state, setState] = useState<ButtonState>('idle')
  const [progress, setProgress] = useState(0)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  useEffect(() => {
    if (isSearching) {
      setState('loading')
    } else {
      setState('idle')
    }
  }, [isSearching])
  
  const handleClick = async () => {
    if (state !== 'idle' || isDisabled) return
    await onSearch()
  }
  
  useEffect(() => {
    if (state === 'loading') {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 300)
      return () => clearInterval(interval)
    } else {
      setProgress(0)
    }
  }, [state])
  
  return (
    <motion.button
      onClick={handleClick}
      disabled={isDisabled || state !== 'idle'}
      className={cn(
        "relative w-28 h-28 sm:w-32 sm:h-32 rounded-full",
        "bg-gradient-to-br from-brand-400 to-brand-600",
        "dark:from-brand-600 dark:to-brand-700",
        "shadow-medium hover:shadow-glow",
        "transition-all duration-300 transform-gpu",
        "focus:outline-none focus:ring-4 focus:ring-brand-500/30",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      whileHover={state === 'idle' ? { scale: 1.06, y: -2 } : {}}
      whileTap={state === 'idle' ? { scale: 0.98 } : {}}
      animate={
        state === 'loading' 
          ? { 
              scale: [1, 1.04, 1],
              transition: { 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }
            }
          : state === 'success'
          ? {
              scale: [1, 1.1, 1.05, 1],
              rotate: [0, 2, -1, 0],
              transition: { 
                duration: 0.6,
                ease: [0.68, -0.55, 0.265, 1.55]
              }
            }
          : {}
      }
    >
      {/* Orbital ring (loading only) */}
      <AnimatePresence>
        {state === 'loading' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-solid border-brand-400/50 dark:border-brand-500/50"
            animate={{ rotate: -180 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </AnimatePresence>
      
      {/* Inner content */}
      <div className="absolute inset-2 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-sm 
        flex items-center justify-center flex-col">
        
        {/* Logo with state animations */}
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                rotateZ: prefersReducedMotion ? 0 : [-2, 2, -2],
                y: prefersReducedMotion ? 0 : [0, -3, 0]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                rotateZ: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <RandomLogo size={64} rounded={true} animated={false} />
            </motion.div>
          )}
          
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                x: prefersReducedMotion ? 0 : [0, -4, 4, -3, 3, 0],
                rotateY: prefersReducedMotion ? 0 : [0, 180, 360],
                rotateZ: prefersReducedMotion ? 0 : [0, 15, 0],
                scale: prefersReducedMotion ? 1 : [1, 1.2, 1.1]
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                x: { duration: 0.2 },
                rotateY: { duration: 0.6, delay: 0.2, ease: [0.68, -0.55, 0.265, 1.55], repeat: Infinity, repeatDelay: 1 },
                rotateZ: { duration: 0.6, delay: 0.2, ease: [0.68, -0.55, 0.265, 1.55], repeat: Infinity, repeatDelay: 1 },
                scale: { duration: 0.6, delay: 0.2, ease: [0.68, -0.55, 0.265, 1.55], repeat: Infinity, repeatDelay: 1 }
              }}
              style={{ perspective: 1000 }}
              className="text-center"
            >
              <div className="mb-3">
                <RandomLogo size={72} rounded={true} animated={false} />
              </div>
              
              {currentParticipants > 0 && (
                <motion.span 
                  className="text-sm text-white font-bold bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {currentParticipants}/5
                </motion.span>
              )}
            </motion.div>
          )}
          
          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 0.6,
                ease: [0.68, -0.55, 0.265, 1.55]
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1.15, 1.1],
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.68, -0.55, 0.265, 1.55]
                }}
              >
                <RandomLogo size={80} rounded={true} animated={false} withAura />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress bar (loading only) */}
        {state === 'loading' && (
          <motion.div
            className="absolute bottom-2 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </div>
      
      {/* Gold/White confetti on success */}
      <AnimatePresence>
        {state === 'success' && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: i % 2 === 0 
                    ? 'linear-gradient(135deg, #f1c232, #f9d56e)'
                    : 'linear-gradient(135deg, #ffffff, #f5f5f5)',
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos((i * 45) * Math.PI / 180) * 120,
                  y: Math.sin((i * 45) * Math.PI / 180) * 120,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
