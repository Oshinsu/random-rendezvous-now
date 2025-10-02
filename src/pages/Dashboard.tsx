
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
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'

const Dashboard = () => {
  const { user, session, refreshSession } = useAuth()
  const { joinRandomGroup, loading, userGroups } = useUnifiedGroups()
  const [isSearching, setIsSearching] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [authDiagnostics, setAuthDiagnostics] = useState<any>(null)
  const navigate = useNavigate()
  const hasInitialized = useRef(false)
  const { t } = useTranslation()
  
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
      // Annuler la recherche
      setIsSearching(false)
      setRedirectCountdown(0)
      clearActiveToasts()
      console.log('🛑 Recherche annulée')
      return
    }

    // Démarrer la recherche
    setIsSearching(true)
    console.log('🎲 Recherche démarrée - animation devrait commencer')
    
    try {
      const success = await joinRandomGroup()
      if (success) {
        console.log('✅ Groupe rejoint - démarrage du countdown de redirection')
        setRedirectCountdown(15)
      } else {
        console.log('❌ Échec de la recherche/création de groupe')
        setIsSearching(false)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      setIsSearching(false)
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

  // Get user initials for avatar
  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U'
  
  // Badge status
  const getStatusBadge = () => {
    if (redirectCountdown > 0) return { text: t('dashboard.status_confirmed'), variant: 'default' as const }
    if (isSearching) return { text: t('dashboard.status_searching'), variant: 'secondary' as const }
    return { text: t('dashboard.status_ready'), variant: 'outline' as const }
  }

  const statusBadge = getStatusBadge()

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="glass-card border-brand-200/50">
            <CardContent className="pt-8 pb-6 space-y-6">
              {/* Header with Avatar and Status */}
              <div className="flex items-center justify-between px-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-10 w-10 border-2 border-brand-400">
                        <AvatarFallback className="bg-gradient-brand text-white font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">{user?.email}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Badge variant={statusBadge.variant} className="font-heading">
                  {statusBadge.text}
                </Badge>
              </div>
              {/* Bouton circulaire avec logo Random */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={handleButtonClick}
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="
                        relative w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto
                        bg-gradient-to-br from-brand-400 to-brand-600 
                        shadow-glow hover:shadow-glow-strong
                        transition-all duration-300
                        focus:outline-none focus:ring-4 focus:ring-brand-300
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      <motion.div 
                        className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm"
                        animate={{ rotate: isSearching ? 360 : 0 }}
                        transition={{ 
                          duration: 4, 
                          repeat: isSearching ? Infinity : 0,
                          ease: "linear" 
                        }}
                      >
                        <div className="flex items-center justify-center w-full h-full">
                          <RandomLogo 
                            size={window.innerWidth < 640 ? 60 : 80} 
                            withAura={false}
                            className="drop-shadow-lg"
                          />
                        </div>
                      </motion.div>
                      
                      {/* Indicateur de statut */}
                      <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white shadow-medium flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {isSearching ? (
                            <motion.div
                              key="searching"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 animate-pulse"
                            />
                          ) : (
                            <motion.div
                              key="ready"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500"
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isSearching ? t('dashboard.cancel') : t('dashboard.find_group')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Texte d'état avec countdown */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={redirectCountdown > 0 ? 'found' : isSearching ? 'searching' : 'ready'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 px-2"
                >
                  <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                    {redirectCountdown > 0 
                      ? t('dashboard.group_found_title')
                      : isSearching 
                      ? t('dashboard.searching_title')
                      : t('dashboard.ready_title')
                    }
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {redirectCountdown > 0
                      ? t('dashboard.redirect_desc', { count: redirectCountdown })
                      : isSearching 
                      ? t('dashboard.searching_desc')
                      : t('dashboard.ready_desc')
                    }
                  </p>
                  
                  {/* Barre de progression pour le countdown */}
                  {redirectCountdown > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full max-w-xs mx-auto mt-4 space-y-2"
                    >
                      <Progress value={((15 - redirectCountdown) / 15) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {t('dashboard.progress_desc')}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Bouton d'accès rapide pendant le countdown */}
              <AnimatePresence>
                {redirectCountdown > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={() => {
                      console.log('🔄 Redirection manuelle vers /groups')
                      clearActiveToasts()
                      navigate('/groups')
                      setIsSearching(false)
                      setRedirectCountdown(0)
                    }}
                    className="btn-primary w-full max-w-xs mx-auto"
                  >
                    {t('dashboard.view_group_now')}
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Diagnostic Panel - Temporary */}
              <div className="mt-6 border-t border-border pt-6">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-xs text-gray-400 hover:text-gray-600 mb-3"
            >
              🔍 Diagnostic Session {showDiagnostics ? '▲' : '▼'}
            </button>
            
            {showDiagnostics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-muted/50 rounded-lg p-4 text-xs space-y-3"
              >
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
              </motion.div>
            )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
