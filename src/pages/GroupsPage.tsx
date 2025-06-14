
import { useEffect } from 'react';
import { useGroups } from '@/hooks/useGroups';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Plus, Sparkles, Trophy, Clock } from 'lucide-react';
import RandomButton from '@/components/RandomButton';

const GroupsPage = () => {
  const { userGroups, loading, fetchUserGroups } = useGroups();

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const completedGroups = userGroups.filter(group => 
    group.status === 'completed'
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-yellow-50/20">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Header amélioré */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-5xl font-heading font-bold bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 bg-clip-text text-transparent">
                Mes Aventures
              </h1>
              <p className="text-xl text-gray-600">
                Tes groupes Random et tes prochaines sorties
              </p>
            </div>
            <Button
              onClick={fetchUserGroups}
              disabled={loading}
              variant="outline"
              size="lg"
              className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Action principale */}
          <div className="bg-gradient-to-r from-white via-amber-50/50 to-white rounded-3xl border-2 border-amber-200/50 p-8 shadow-xl">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2 font-heading">Prêt pour une nouvelle aventure ?</h2>
              <p className="text-lg text-gray-600">Clique sur le bouton et laisse la magie opérer !</p>
            </div>
            <div className="flex justify-center">
              <RandomButton />
            </div>
          </div>

          {/* Stats améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Groupes Actifs</p>
                  <p className="text-4xl font-bold text-blue-700">{activeGroups.length}</p>
                  <p className="text-xs text-blue-500">En attente ou confirmés</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Complétées</p>
                  <p className="text-4xl font-bold text-green-700">{completedGroups.length}</p>
                  <p className="text-xs text-green-500">Aventures terminées</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-600 uppercase tracking-wider">Total</p>
                  <p className="text-4xl font-bold text-purple-700">{userGroups.length}</p>
                  <p className="text-xs text-purple-500">Toutes aventures</p>
                </div>
              </div>
            </div>
          </div>

          {/* Groupes actifs */}
          {activeGroups.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-amber-600" />
                <h2 className="text-3xl font-heading font-bold text-gray-800">Tes Groupes Actifs</h2>
              </div>
              <GroupsList
                groups={activeGroups}
                title=""
                emptyMessage="Aucun groupe actif"
              />
            </div>
          )}

          {/* Groupes complétés */}
          {completedGroups.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-green-600" />
                <h2 className="text-3xl font-heading font-bold text-gray-800">Tes Aventures Complétées</h2>
              </div>
              <GroupsList
                groups={completedGroups}
                title=""
                emptyMessage="Aucune aventure complétée"
              />
            </div>
          )}

          {/* État vide amélioré */}
          {userGroups.length === 0 && !loading && (
            <div className="text-center py-20 space-y-8 bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/20 rounded-3xl border-2 border-amber-200/50 shadow-xl">
              <div className="space-y-4">
                <div className="text-9xl animate-bounce">🎲</div>
                <h3 className="text-4xl font-bold text-gray-800 font-heading">Prêt pour l'aventure ?</h3>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Tu n'as pas encore rejoint de groupe. C'est le moment parfait pour commencer ta première aventure Random ! 
                  Un clic, 5 personnes, un bar mystère... L'aventure t'attend !
                </p>
              </div>
              <div className="pt-6">
                <RandomButton />
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && userGroups.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">Chargement de tes aventures...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
