
import { useAuth } from '@/contexts/AuthContext'
import RandomButton from '@/components/RandomButton'
import AppLayout from '@/components/AppLayout'

const Dashboard = () => {
  const { user } = useAuth()
  const userName = user?.user_metadata?.first_name ?? 'Aventurier'

  return (
    <AppLayout>
      <div className="min-h-full flex flex-col bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20">
        {/* Grand logo discret en haut */}
        <div className="flex flex-col items-center pt-14 pb-8">
          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow mb-2">
            <span className="text-white text-4xl font-bold font-playfair drop-shadow-glow-gold select-none">R</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent drop-shadow-glow-gold tracking-tight">
            Random
          </h1>
        </div>

        {/* Zone centrale – aérée et large */}
        <div className="flex flex-col items-center flex-1 justify-start px-2">
          <div className="max-w-xl w-full flex flex-col items-center space-y-10">
            {/* Message de bienvenue */}
            <div className="text-center mt-1">
              <div className="font-heading text-2xl md:text-3xl text-neutral-800 font-bold mb-2">
                Bienvenue, {userName}
              </div>
              <p className="font-body text-lg md:text-xl text-amber-900/90 font-medium mb-4">
                Prêt·e à vivre une aventure spontanée près de chez toi&nbsp;?
              </p>
            </div>

            {/* GROS bouton Démarrer, parfaitement centré */}
            <div className="flex justify-center w-full mt-6 mb-4">
              <RandomButton size="lg" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
