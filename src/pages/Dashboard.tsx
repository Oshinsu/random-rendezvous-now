
import { useAuth } from '@/contexts/AuthContext'
import RandomButton from '@/components/RandomButton'
import AppLayout from '@/components/AppLayout'

const Dashboard = () => {
  const { user } = useAuth()
  const userName = user?.user_metadata?.first_name ?? 'Aventurier'

  return (
    <AppLayout>
      <div className="min-h-full bg-white">
        <div className="px-8 py-12">
          <div className="max-w-4xl">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Bonjour <span className="text-amber-600">{userName}</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                Découvrez de nouvelles personnes autour d'un verre. 
                Rejoignez une aventure spontanée près de chez vous.
              </p>
            </div>
            
            <div className="space-y-8">
              <div>
                <RandomButton size="lg" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">🎯</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Simple</h3>
                  <p className="text-sm text-gray-600">Un clic et vous êtes dans l'aventure</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">🌍</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Local</h3>
                  <p className="text-sm text-gray-600">Rencontrez des gens près de chez vous</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">⚡</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Instantané</h3>
                  <p className="text-sm text-gray-600">Groupes formés automatiquement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
