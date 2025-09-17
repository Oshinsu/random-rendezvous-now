
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

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-brand-50 p-4">
        <div className="text-center space-y-6 sm:space-y-8 w-full max-w-md mx-auto">
          {/* Bouton circulaire avec logo Random */}
          <button
            onClick={handleButtonClick}
            disabled={loading}
            className="
              relative w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto
              bg-gradient-to-br from-brand-400 to-brand-600 
              shadow-glow hover:shadow-glow-strong
              transition-all duration-300 transform-gpu
              hover:scale-105 active:scale-95
              focus:outline-none focus:ring-4 focus:ring-brand-300
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <div 
              className={`
                absolute inset-2 rounded-full bg-white/10 backdrop-blur-sm
                ${isSearching ? 'animate-spin' : ''}
              `}
              style={{
                animationDuration: '4s',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite'
              }}
            >
              <div className="flex items-center justify-center w-full h-full">
                <RandomLogo 
                  size={window.innerWidth < 640 ? 60 : 80} 
                  withAura={false}
                  className="drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* Indicateur de statut */}
            <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white shadow-medium flex items-center justify-center">
              {isSearching ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 animate-pulse"></div>
              ) : (
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500"></div>
              )}
            </div>
          </button>

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
