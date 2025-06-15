import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups'
import { useNavigate } from 'react-router-dom'
import RandomLogo from '@/components/RandomLogo'
import AppLayout from '@/components/AppLayout'
import { clearActiveToasts } from '@/utils/toastUtils'

const Dashboard = () => {
  const { user } = useAuth()
  const { joinRandomGroup, loading, userGroups } = useUnifiedGroups()
  const [isSearching, setIsSearching] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const navigate = useNavigate()

  // Nettoyer les toasts au montage du composant
  useEffect(() => {
    clearActiveToasts()
  }, [])

  const handleButtonClick = async () => {
    if (isSearching) {
      // Annuler la recherche
      setIsSearching(false)
      setRedirectCountdown(0)
      clearActiveToasts() // Nettoyer les toasts lors de l'annulation
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
        // Démarrer le countdown de 15 secondes
        setRedirectCountdown(15)
      } else {
        // En cas d'échec, arrêter l'animation
        setIsSearching(false)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      // En cas d'erreur, arrêter l'animation
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
            clearActiveToasts() // Nettoyer avant la redirection
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

  // Effect pour surveiller si l'utilisateur a déjà un groupe et arrêter l'animation
  useEffect(() => {
    if (userGroups.length > 0 && isSearching && redirectCountdown === 0) {
      console.log('🎯 Groupe détecté, démarrage du countdown')
      setRedirectCountdown(15)
    }
  }, [userGroups, isSearching, redirectCountdown])

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-brand-50">
        <div className="text-center space-y-8">
          {/* Bouton circulaire avec logo Random */}
          <button
            onClick={handleButtonClick}
            disabled={loading}
            className="
              relative w-40 h-40 rounded-full 
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
                  size={80} 
                  withAura={false}
                  className="drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* Indicateur de statut */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-medium flex items-center justify-center">
              {isSearching ? (
                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
              )}
            </div>
          </button>

          {/* Texte d'état avec countdown */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {redirectCountdown > 0 
                ? 'Groupe créé avec succès !' 
                : isSearching 
                ? 'Recherche en cours...' 
                : 'Prêt pour l\'aventure'
              }
            </h1>
            <p className="text-gray-600">
              {redirectCountdown > 0
                ? `Redirection vers votre groupe dans ${redirectCountdown}s`
                : isSearching 
                ? 'Cliquez à nouveau pour annuler' 
                : 'Cliquez sur le bouton pour démarrer'
              }
            </p>
            
            {/* Barre de progression pour le countdown */}
            {redirectCountdown > 0 && (
              <div className="w-64 mx-auto mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((15 - redirectCountdown) / 15) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ou cliquez pour accéder immédiatement à votre groupe
                </p>
              </div>
            )}
          </div>

          {/* Bouton d'accès rapide pendant le countdown */}
          {redirectCountdown > 0 && (
            <button
              onClick={() => {
                console.log('🔄 Redirection manuelle vers /groups')
                clearActiveToasts() // Nettoyer avant la redirection
                navigate('/groups')
                setIsSearching(false)
                setRedirectCountdown(0)
              }}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
            >
              Voir mon groupe maintenant
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
