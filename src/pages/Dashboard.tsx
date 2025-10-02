
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
import { Sparkles, MapPin, Users } from 'lucide-react'

const Dashboard = () => {
  const { user, session, refreshSession } = useAuth()
  const { joinRandomGroup, loading, userGroups } = useUnifiedGroups()
  const [isSearching, setIsSearching] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [authDiagnostics, setAuthDiagnostics] = useState<any>(null)
  const [processStep, setProcessStep] = useState<'idle' | 'cleaning' | 'locating' | 'creating'>('idle')
  const [showConfetti, setShowConfetti] = useState(false)
  const navigate = useNavigate()
  const hasInitialized = useRef(false)
  const { t } = useTranslation()
  const buttonControls = useAnimation()
  const ringControls = useAnimation()
  
  // DIAGNOSTIC: Vérifier la session d'authentification
  useEffect(() => {
    const runAuthDiagnostics = async () => {
      console.log('🔍 === DIAGNOSTIC D\'AUTHENTIFICATION ===')
      
      try {
        // 1. État du contexte AuthContext
        console.log('📱 AuthContext State:')
        console.log('  - user:', user ? `${user.id} (${user.email})` : 'null')
        console.log('  - session:', session ? 'présente' : 'null')
        
        // 2. Vérification directe Supabase
        const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser()
        const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔗 Supabase Direct:')
        console.log('  - supabase.auth.getUser():', supabaseUser ? `${supabaseUser.id}` : 'null', userError ? `ERROR: ${userError.message}` : '')
        console.log('  - supabase.auth.getSession():', supabaseSession ? 'présente' : 'null', sessionError ? `ERROR: ${sessionError.message}` : '')
        
        // 3. Test RLS avec auth.uid()
        const { data: rlsTest, error: rlsError } = await supabase.from('profiles').select('id').limit(1)
        console.log('🛡️ Test RLS (profiles):', rlsTest ? `${rlsTest.length} résultats` : 'null', rlsError ? `ERROR: ${rlsError.message}` : 'OK')
        
        // 4. localStorage inspection
        const authKeys = Object.keys(localStorage).filter(key => key.includes('auth'))
        console.log('💾 LocalStorage auth keys:', authKeys.length, authKeys)
        
        // Stocker les diagnostics pour l'affichage
        setAuthDiagnostics({
          contextUser: user,
          contextSession: !!session,
          supabaseUser,
          supabaseSession: !!supabaseSession,
          userError: userError?.message,
          sessionError: sessionError?.message,
          rlsTest: rlsTest ? rlsTest.length : null,
          rlsError: rlsError?.message,
          authKeysCount: authKeys.length,
          timestamp: new Date().toLocaleTimeString()
        })
        
        // 5. Alerte si désynchronisation détectée
        const hasContextAuth = !!(user && session)
        const hasSupabaseAuth = !!(supabaseUser && supabaseSession)
        
        if (hasContextAuth !== hasSupabaseAuth) {
          console.log('⚠️ DÉSYNCHRONISATION DÉTECTÉE!')
          console.log(`  - Context: ${hasContextAuth ? 'Authentifié' : 'Non authentifié'}`)
          console.log(`  - Supabase: ${hasSupabaseAuth ? 'Authentifié' : 'Non authentifié'}`)
          
          toast({
            title: '⚠️ Session corrompue détectée',
            description: 'Désynchronisation entre frontend et backend',
            variant: 'destructive',
          })
        }
        
      } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error)
        setAuthDiagnostics({
          error: String(error),
          timestamp: new Date().toLocaleTimeString()
        })
      }
    }
    
    if (!hasInitialized.current) {
      runAuthDiagnostics()
    }
  }, [user, session])
  
  // Force reconnect function
  const handleForceReconnect = async () => {
    try {
      console.log('🔄 Force reconnect initiated...')
      
      // 1. Clear localStorage auth data
      const authKeys = Object.keys(localStorage).filter(key => key.includes('auth'))
      authKeys.forEach(key => localStorage.removeItem(key))
      console.log('🧹 Cleared localStorage auth keys:', authKeys.length)
      
      // 2. Force sign out
      await supabase.auth.signOut()
      console.log('🚪 Signed out from Supabase')
      
      // 3. Clear cookies (if any)
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes('auth') || name.includes('supabase')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        }
      })
      
      toast({
        title: '🔄 Reconnexion forcée',
        description: 'Redirection vers la page de connexion...',
      })
      
      // 4. Navigate to auth page
      setTimeout(() => {
        navigate('/')
      }, 1500)
      
    } catch (error) {
      console.error('❌ Erreur lors de la reconnexion forcée:', error)
      toast({
        title: '❌ Erreur',
        description: 'Impossible de forcer la reconnexion',
        variant: 'destructive',
      })
    }
  }

  // Nettoyer les toasts au montage du composant - UNE SEULE FOIS
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
      console.log('🛑 Recherche annulée')
      return
    }

    setIsSearching(true)
    console.log('🎲 Recherche démarrée - animation devrait commencer')
    
    // Animation sequence
    await buttonControls.start({
      scale: 0.9,
      transition: { duration: 0.2 }
    })
    await buttonControls.start({
      scale: 1.1,
      transition: { duration: 0.3, type: 'spring' }
    })
    await buttonControls.start({
      scale: 1,
      transition: { duration: 0.2 }
    })
    
    try {
      // Step 1: Cleaning
      setProcessStep('cleaning')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Step 2: Locating
      setProcessStep('locating')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Step 3: Creating
      setProcessStep('creating')
      const success = await joinRandomGroup()
      
      if (success) {
        console.log('✅ Groupe rejoint - démarrage du countdown de redirection')
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
        setRedirectCountdown(15)
        setProcessStep('idle')
      } else {
        console.log('❌ Échec de la recherche/création de groupe')
        setIsSearching(false)
        setProcessStep('idle')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      setIsSearching(false)
      setProcessStep('idle')
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
    // Groups status check
    
    if (userGroups.length > 0 && isSearching && redirectCountdown === 0) {
      console.log('🎯 Groupe détecté, démarrage du countdown')
      setRedirectCountdown(15)
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

  const progressValue = processStep === 'cleaning' ? 33 : processStep === 'locating' ? 66 : processStep === 'creating' ? 100 : 0

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

              {/* Progress Ring */}
              {isSearching && processStep !== 'idle' && (
                <svg
                  className="absolute inset-0 -rotate-90 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                >
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="47%"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progressValue / 100 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(241, 194, 50, 0.6))'
                    }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f1c232" />
                      <stop offset="50%" stopColor="#e94e77" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
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

            {/* Step indicators below button */}
            {isSearching && (
              <div className="flex justify-center gap-6 mt-8">
                <motion.div
                  className="flex flex-col items-center gap-2"
                  animate={{
                    scale: processStep === 'cleaning' ? 1.2 : 1,
                    opacity: processStep === 'cleaning' ? 1 : 0.4
                  }}
                >
                  <Sparkles className={`w-6 h-6 ${processStep === 'cleaning' ? 'text-brand-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{t('dashboard.step_cleaning') || 'Nettoyage'}</span>
                </motion.div>
                
                <motion.div
                  className="flex flex-col items-center gap-2"
                  animate={{
                    scale: processStep === 'locating' ? 1.2 : 1,
                    opacity: processStep === 'locating' ? 1 : 0.4
                  }}
                >
                  <MapPin className={`w-6 h-6 ${processStep === 'locating' ? 'text-brand-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{t('dashboard.step_locating') || 'Localisation'}</span>
                </motion.div>
                
                <motion.div
                  className="flex flex-col items-center gap-2"
                  animate={{
                    scale: processStep === 'creating' ? 1.2 : 1,
                    opacity: processStep === 'creating' ? 1 : 0.4
                  }}
                >
                  <Users className={`w-6 h-6 ${processStep === 'creating' ? 'text-brand-500' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{t('dashboard.step_creating') || 'Création'}</span>
                </motion.div>
              </div>
            )}
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

          {/* Diagnostic Panel - Temporary */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-xs text-gray-400 hover:text-gray-600 mb-3"
            >
              🔍 Diagnostic Session {showDiagnostics ? '▲' : '▼'}
            </button>
            
            {showDiagnostics && (
              <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-3">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={handleForceReconnect}
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    🚪 Force Reconnect
                  </button>
                </div>
                
                {authDiagnostics && (
                  <div className="space-y-2">
                    <p><strong>Timestamp:</strong> {authDiagnostics.timestamp}</p>
                    <p><strong>Context User:</strong> {authDiagnostics.contextUser?.id || 'null'}</p>
                    <p><strong>Context Session:</strong> {authDiagnostics.contextSession ? '✅' : '❌'}</p>
                    <p><strong>Supabase User:</strong> {authDiagnostics.supabaseUser?.id || 'null'}</p>
                    <p><strong>Supabase Session:</strong> {authDiagnostics.supabaseSession ? '✅' : '❌'}</p>
                    
                    {authDiagnostics.userError && (
                      <p className="text-red-600"><strong>User Error:</strong> {authDiagnostics.userError}</p>
                    )}
                    {authDiagnostics.sessionError && (
                      <p className="text-red-600"><strong>Session Error:</strong> {authDiagnostics.sessionError}</p>
                    )}
                    
                    <p><strong>RLS Test:</strong> {
                      authDiagnostics.rlsTest !== null ? `${authDiagnostics.rlsTest} résultats` : 'Failed'
                    }</p>
                    {authDiagnostics.rlsError && (
                      <p className="text-red-600"><strong>RLS Error:</strong> {authDiagnostics.rlsError}</p>
                    )}
                    
                    <p><strong>Auth Keys in localStorage:</strong> {authDiagnostics.authKeysCount}</p>
                    
                    {authDiagnostics.error && (
                      <p className="text-red-600"><strong>Diagnostic Error:</strong> {authDiagnostics.error}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
