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
        "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full",
        "bg-gradient-to-br from-brand-400 to-brand-600",
        "dark:from-brand-600 dark:to-brand-700",
        "shadow-medium hover:shadow-glow",
        "transition-all duration-300 transform-gpu",
        "focus:outline-none focus:ring-4 focus:ring-brand-500/30",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      whileHover={state === 'idle' ? { scale: 1.02, y: -2 } : {}}
      whileTap={state === 'idle' ? { scale: 0.98 } : {}}
      animate={
        state === 'loading' 
          ? { 
              scale: [1, 1.05, 0.98, 1.05],
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
            className="absolute inset-0 rounded-full border-2 border-dashed border-brand-400/50 dark:border-brand-500/50"
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
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <RandomLogo size={64} rounded={true} animated={false} />
              </motion.div>
            </motion.div>
          )}
          
          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="mb-3"
              >
                <RandomLogo size={72} rounded={true} animated={false} />
              </motion.div>
              
              {currentParticipants > 0 && (
                <motion.span 
                  className="text-sm text-white font-bold bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm"
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
                  scale: [1, 1.3, 1.1, 1],
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
      
      {/* Status indicator dot */}
      <motion.div
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card dark:bg-neutral-800 shadow-medium flex items-center justify-center"
        animate={{
          scale: state === 'loading' ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: state === 'loading' ? Infinity : 0,
        }}
      >
        <div className={cn(
          "w-3 h-3 rounded-full",
          {
            'bg-green-500': state === 'idle',
            'bg-yellow-500 animate-pulse': state === 'loading',
            'bg-emerald-500': state === 'success',
          }
        )} />
      </motion.div>
      
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
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
