
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups'
import { useNavigate } from 'react-router-dom'
import RandomLogo from '@/components/RandomLogo'
import AppLayout from '@/components/AppLayout'
import { clearActiveToasts } from '@/utils/toastUtils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { motion, useAnimation } from 'framer-motion'

const Dashboard = () => {
  const { user, session, refreshSession } = useAuth()
  const { joinRandomGroup, loading, userGroups } = useUnifiedGroups()
  const [isSearching, setIsSearching] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const [processStep, setProcessStep] = useState<'idle' | 'creating'>('idle')
  const [showConfetti, setShowConfetti] = useState(false)
  const navigate = useNavigate()
  const hasInitialized = useRef(false)
  const { t } = useTranslation()
  const buttonControls = useAnimation()
  const ringControls = useAnimation()
  
  // Nettoyer les toasts au montage - UNE SEULE FOIS
  useEffect(() => {
    if (!hasInitialized.current) {
      clearActiveToasts()
      hasInitialized.current = true
    }
  }, [])

  const handleButtonClick = async () => {
    if (isSearching) {
      setIsSearching(false)
      setRedirectCountdown(0)
      setProcessStep('idle')
      clearActiveToasts()
      return
    }

    setIsSearching(true)
    setProcessStep('creating')
    
    // Animation d'entrée rapide
    buttonControls.start({
      scale: [1, 0.95, 1.05, 1],
      transition: { duration: 0.4, ease: 'easeInOut' }
    })
    
    // Timeout de sécurité (30 secondes max)
    const timeoutId = setTimeout(() => {
      if (isSearching) {
        setIsSearching(false)
        setProcessStep('idle')
        toast({
          title: t('dashboard.error_timeout') || 'Temps écoulé',
          description: t('dashboard.error_timeout_desc') || 'La recherche a pris trop de temps. Réessayez.',
          variant: 'destructive',
        })
      }
    }, 30000)
    
    try {
      const success = await joinRandomGroup()
      clearTimeout(timeoutId)
      
      if (success) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
        setRedirectCountdown(5)
        setProcessStep('idle')
      } else {
        setIsSearching(false)
        setProcessStep('idle')
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('Erreur lors de la recherche:', error)
      setIsSearching(false)
      setProcessStep('idle')
      toast({
        title: t('dashboard.error') || 'Erreur',
        description: t('dashboard.error_desc') || 'Une erreur est survenue. Réessayez.',
        variant: 'destructive',
      })
    }
  }

  // Effect pour gérer le countdown et la redirection automatique
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            console.log('🔄 Redirection automatique vers /groups')
            clearActiveToasts()
            navigate('/groups')
            setIsSearching(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [redirectCountdown, navigate])

  // Effect pour surveiller les groupes et déclencher le countdown
  useEffect(() => {
    if (userGroups.length > 0 && isSearching && redirectCountdown === 0) {
      setRedirectCountdown(5)
    }
  }, [userGroups, isSearching, redirectCountdown])

  // Animation variants
  const buttonVariants = {
    idle: {
      scale: 1,
      rotate: 0,
      boxShadow: '0 10px 40px -10px rgba(241, 194, 50, 0.3), 0 0 20px rgba(241, 194, 50, 0.1)'
    },
    hover: {
      scale: 1.08,
      rotate: [0, -3, 3, -3, 0],
      boxShadow: '0 20px 60px -10px rgba(241, 194, 50, 0.5), 0 0 40px rgba(241, 194, 50, 0.2), 0 0 80px rgba(241, 194, 50, 0.1)'
    },
    tap: {
      scale: 0.95
    }
  }

  

  const Confetti = () => (
    <>
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 1,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: Math.random() * -300 - 100,
            opacity: 0,
            rotate: Math.random() * 360
          }}
          transition={{
            duration: Math.random() * 1 + 1.5,
            ease: 'easeOut'
          }}
          className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full pointer-events-none"
          style={{
            background: ['#f1c232', '#e94e77', '#6366f1', '#10b981', '#f59e0b'][i % 5]
          }}
        />
      ))}
    </>
  )

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-brand-50 p-4">
        <div className="text-center space-y-6 sm:space-y-8 w-full max-w-md mx-auto">
          {/* Exceptional Animated Button */}
          <div className="relative">
            <motion.button
              onClick={handleButtonClick}
              disabled={loading}
              animate={buttonControls}
              variants={buttonVariants}
              initial="idle"
              whileHover={!isSearching ? "hover" : undefined}
              whileTap={!isSearching ? "tap" : undefined}
              className="
                relative w-40 h-40 sm:w-48 sm:h-48 rounded-full mx-auto
                bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 
                focus:outline-none focus:ring-4 focus:ring-brand-300
                disabled:opacity-50 disabled:cursor-not-allowed
                overflow-visible
              "
            >
              {/* Orbiting particles when hovering */}
              {!isSearching && (
                <>
                  {[0, 120, 240].map((angle) => (
                    <motion.div
                      key={angle}
                      className="absolute w-2 h-2 rounded-full bg-brand-300"
                      style={{
                        top: '50%',
                        left: '50%',
                        x: '-50%',
                        y: '-50%'
                      }}
                      animate={{
                        x: [
                          Math.cos((angle * Math.PI) / 180) * 100 - 4,
                          Math.cos(((angle + 360) * Math.PI) / 180) * 100 - 4
                        ],
                        y: [
                          Math.sin((angle * Math.PI) / 180) * 100 - 4,
                          Math.sin(((angle + 360) * Math.PI) / 180) * 100 - 4
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  ))}
                </>
              )}

              {/* Rotating ring when searching */}
              {isSearching && (
                <svg
                  className="absolute inset-0 -rotate-90 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                >
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="47%"
                    fill="none"
                    stroke="rgba(241, 194, 50, 0.3)"
                    strokeWidth="4"
                    strokeDasharray="10 5"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      ease: 'linear',
                      repeat: Infinity
                    }}
                  />
                </svg>
              )}

              {/* Inner rotating ring when searching */}
              <motion.div 
                className="absolute inset-3 rounded-full bg-white/10 backdrop-blur-sm"
                animate={isSearching ? { rotate: 360 } : {}}
                transition={isSearching ? {
                  duration: 4,
                  ease: 'linear',
                  repeat: Infinity
                } : {}}
              >
                <div className="flex items-center justify-center w-full h-full">
                  <motion.div
                    animate={isSearching ? { 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={isSearching ? {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    } : {}}
                  >
                    <RandomLogo 
                      size={window.innerWidth < 640 ? 70 : 90} 
                      withAura={isSearching}
                      className="drop-shadow-lg"
                    />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Status indicator */}
              <motion.div 
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-medium flex items-center justify-center"
                animate={isSearching ? { scale: [1, 1.2, 1] } : {}}
                transition={isSearching ? { duration: 1, repeat: Infinity } : {}}
              >
                {isSearching ? (
                  <div className="w-5 h-5 rounded-full bg-red-500 animate-pulse"></div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-green-500"></div>
                )}
              </motion.div>

              {/* Confetti explosion on success */}
              {showConfetti && <Confetti />}
            </motion.button>

          </div>

          {/* Texte d'état avec countdown */}
          <div className="space-y-2 px-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {redirectCountdown > 0 
                ? t('dashboard.group_found_title')
                : isSearching 
                ? t('dashboard.searching_title')
                : t('dashboard.ready_title')
              }
            </h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {redirectCountdown > 0
                ? t('dashboard.redirect_desc', { count: redirectCountdown })
                : isSearching 
                ? t('dashboard.searching_desc')
                : t('dashboard.ready_desc')
              }
            </p>
            
            {/* Barre de progression pour le countdown */}
            {redirectCountdown > 0 && (
              <div className="w-full max-w-xs mx-auto mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((15 - redirectCountdown) / 15) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 px-2">
                  {t('dashboard.progress_desc')}
                </p>
              </div>
            )}
          </div>

          {/* Bouton d'accès rapide pendant le countdown */}
          {redirectCountdown > 0 && (
            <button
            onClick={() => {
              console.log('🔄 Redirection manuelle vers /groups')
              clearActiveToasts()
              navigate('/groups')
              setIsSearching(false)
              setRedirectCountdown(0)
            }}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors text-sm sm:text-base w-full max-w-xs"
            >
              {t('dashboard.view_group_now')}
            </button>
          )}

        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
