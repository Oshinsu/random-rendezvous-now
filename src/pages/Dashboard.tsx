
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups'
import { useNavigate } from 'react-router-dom'
import RandomLogo from '@/components/RandomLogo'
import AppLayout from '@/components/AppLayout'
import { clearActiveToasts } from '@/utils/toastUtils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTranslation } from 'react-i18next'
import { toast } from '@/hooks/use-toast'
import { motion, useAnimation, AnimatePresence, useInView } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const Dashboard = () => {
  const { user } = useAuth()
  const { joinRandomGroup, loading, userGroups } = useUnifiedGroups()
  const [isSearching, setIsSearching] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const [processStep, setProcessStep] = useState<'idle' | 'creating'>('idle')
  const [showConfetti, setShowConfetti] = useState(false)
  const navigate = useNavigate()
  const hasInitialized = useRef(false)
  const { t } = useTranslation()
  const buttonControls = useAnimation()
  const cardRef = useRef(null)
  const isInView = useInView(cardRef, { once: true, amount: 0.3 })
  
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

  // Get user initials for avatar
  const userInitials = user 
    ? `${user.email?.charAt(0).toUpperCase() || 'U'}` 
    : 'U'

  // Get status badge
  const getStatusBadge = () => {
    if (redirectCountdown > 0) return { label: t('groups.status.confirmed'), variant: 'default' as const }
    if (isSearching) return { label: t('dashboard.searching'), variant: 'secondary' as const }
    return { label: t('dashboard.ready_title'), variant: 'outline' as const }
  }

  const statusBadge = getStatusBadge()

  return (
    <AppLayout>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-brand-50/30 to-neutral-50 p-4">
          {/* Header with Avatar */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-6xl mx-auto pt-4 pb-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Badge 
                variant={statusBadge.variant}
                className="font-grotesk text-sm px-4 py-1.5"
              >
                {statusBadge.label}
              </Badge>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-12 w-12 cursor-pointer ring-2 ring-brand-200 hover:ring-brand-400 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-white font-grotesk font-bold text-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-grotesk">{user?.email}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              ref={cardRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-2xl"
            >
              <Card className="border-2 border-brand-200 shadow-glow bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 space-y-6 sm:space-y-8">
                  {/* Main Action Button */}
                  <div className="relative">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={handleButtonClick}
                          disabled={loading}
                          animate={buttonControls}
                          variants={buttonVariants}
                          initial="idle"
                          whileHover={!isSearching ? "hover" : undefined}
                          whileTap={!isSearching ? "tap" : undefined}
                          className="
                            relative w-48 h-48 sm:w-56 sm:h-56 rounded-full mx-auto
                            bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 
                            focus:outline-none focus:ring-4 focus:ring-brand-300
                            disabled:opacity-50 disabled:cursor-not-allowed
                            overflow-visible font-grotesk
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
                      </TooltipTrigger>
                      <TooltipContent className="font-grotesk">
                        <p>{isSearching ? t('dashboard.cancel') : t('dashboard.ready_desc')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Status Messages */}
                  <AnimatePresence mode="wait">
                    {isSearching && (
                      <motion.div 
                        key="searching"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-center space-y-3"
                      >
                        <p className="text-neutral-700 font-grotesk font-medium text-lg">
                          {t('dashboard.searching') || 'Recherche en cours...'}
                        </p>
                        <button
                          onClick={() => {
                            setIsSearching(false)
                            setRedirectCountdown(0)
                            setProcessStep('idle')
                            clearActiveToasts()
                          }}
                          className="text-sm text-neutral-500 hover:text-neutral-700 underline transition-colors font-grotesk"
                        >
                          {t('dashboard.cancel') || 'Annuler'}
                        </button>
                      </motion.div>
                    )}
                    
                    {redirectCountdown > 0 && (
                      <motion.div
                        key="redirecting"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-brand-100 to-brand-50 border-2 border-brand-300 rounded-xl shadow-medium"
                      >
                        <div className="flex-1 text-brand-800 font-grotesk font-semibold">
                          {t('dashboard.redirecting', { seconds: redirectCountdown }) || `Redirection dans ${redirectCountdown}s...`}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate('/groups')}
                          className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-grotesk font-medium rounded-lg transition-colors shadow-sm"
                        >
                          {t('dashboard.go_now') || 'Y aller'}
                        </motion.button>
                      </motion.div>
                    )}

                    {userGroups.length > 0 && !isSearching && redirectCountdown === 0 && (
                      <motion.button
                        key="view-group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          clearActiveToasts()
                          navigate('/groups')
                        }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-grotesk font-semibold transition-all shadow-medium"
                      >
                        {t('dashboard.view_group_now')}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </TooltipProvider>
    </AppLayout>
  )
}

export default Dashboard
