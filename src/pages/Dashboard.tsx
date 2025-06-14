
import { useAuth } from '@/contexts/AuthContext'
import RandomButton from '@/components/RandomButton'
import AppLayout from '@/components/AppLayout'

const Dashboard = () => {
  const { user } = useAuth()
  const userName = user?.user_metadata?.first_name ?? 'Aventurier'

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 py-8 px-6">
        {/* Header "Bienvenue" placé à gauche */}
        <div className="w-full max-w-4xl pl-2 pr-8">
          <h1 className="font-heading text-3xl font-bold text-neutral-900 mb-1">
            Bienvenue, <span className="text-amber-700">{userName}</span>
          </h1>
          <p className="font-body text-lg text-neutral-700 mb-6 max-w-xl">
            Prêt·e à vivre une aventure spontanée près de chez toi ? Lance une aventure et rejoins un groupe local en quelques secondes.
          </p>
          {/* Bouton Démarrer - taille large, aligné à gauche */}
          <div className="w-auto">
            <RandomButton size="lg" />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard

