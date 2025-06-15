
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useGroups } from '@/hooks/useGroups'
import RandomLogo from '@/components/RandomLogo'
import AppLayout from '@/components/AppLayout'

const Dashboard = () => {
  const { user } = useAuth()
  const { joinRandomGroup, loading } = useGroups()
  const [isSearching, setIsSearching] = useState(false)

  const handleButtonClick = async () => {
    if (isSearching) {
      // Annuler la recherche
      setIsSearching(false)
      console.log('🛑 Recherche annulée')
      return
    }

    // Démarrer la recherche
    setIsSearching(true)
    console.log('🎲 Recherche démarrée - animation devrait commencer')
    
    try {
      await joinRandomGroup()
      // Ne pas arrêter l'animation ici - elle continue jusqu'à ce que l'utilisateur clique pour annuler
      console.log('✅ Groupe rejoint - animation continue')
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      // En cas d'erreur, arrêter l'animation
      setIsSearching(false)
    }
    // Pas de finally ici - l'animation continue
  }

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

          {/* Texte d'état */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">
              {isSearching ? 'Recherche en cours...' : 'Prêt pour l\'aventure'}
            </h1>
            <p className="text-gray-600">
              {isSearching 
                ? 'Cliquez à nouveau pour annuler' 
                : 'Cliquez sur le bouton pour démarrer'
              }
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
