
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSimpleGroupManagement } from '@/hooks/useSimpleGroupManagement'
import { useNavigate } from 'react-router-dom'
import RandomLogo from '@/components/RandomLogo'
import AppLayout from '@/components/AppLayout'
import { clearActiveToasts } from '@/utils/toastUtils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTranslation } from 'react-i18next'

const Dashboard = () => {
  const { user } = useAuth()
  const { joinRandomGroup, loading, userGroups } = useSimpleGroupManagement()
  const [isSearching, setIsSearching] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const navigate = useNavigate()
  const hasInitialized = useRef(false)
  const { t } = useTranslation()
  // Remove page view and action tracking

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

        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
