
import { useGroups } from '@/hooks/useGroups';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Trophy, Clock } from 'lucide-react';
import RandomButton from '@/components/RandomButton';

const GroupsPage = () => {
  const { userGroups, loading, fetchUserGroups } = useGroups();

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );
  const completedGroups = userGroups.filter(group => 
    group.status === 'completed'
  );

  const handleRefresh = () => {
    console.log('🔄 Refresh manuel des groupes (page Groups)');
    fetchUserGroups();
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-white">
        <div className="px-8 py-8">
          <div className="max-w-5xl">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Groupes</h1>
                <p className="text-gray-600">Gérez vos aventures passées et à venir</p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:border-amber-500 hover:text-amber-600"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            {/* Nouvelle aventure */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-8 mb-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Prêt pour une nouvelle aventure ?
                </h2>
                <p className="text-gray-600 mb-6">
                  Rejoignez un groupe près de chez vous en quelques secondes
                </p>
                <RandomButton size="sm" />
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-600 mb-1">{activeGroups.length}</div>
                <div className="text-sm text-blue-700">Groupes actifs</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <Trophy className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-600 mb-1">{completedGroups.length}</div>
                <div className="text-sm text-green-700">Aventures terminées</div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-6 text-center">
                <Users className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-amber-600 mb-1">{userGroups.length}</div>
                <div className="text-sm text-amber-700">Total</div>
              </div>
            </div>

            {/* Groupes actifs */}
            {activeGroups.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Groupes Actifs
                </h2>
                <GroupsList
                  groups={activeGroups}
                  title=""
                  emptyMessage="Aucun groupe actif"
                />
              </div>
            )}

            {/* Aventures terminées */}
            {completedGroups.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-green-600" />
                  Aventures Terminées
                </h2>
                <GroupsList
                  groups={completedGroups}
                  title=""
                  emptyMessage="Aucune aventure terminée"
                />
              </div>
            )}

            {/* État vide */}
            {userGroups.length === 0 && !loading && (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucune aventure pour le moment
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Commencez votre première aventure en rejoignant un groupe près de chez vous
                </p>
                <RandomButton size="sm" />
              </div>
            )}

            {/* État de chargement */}
            {loading && userGroups.length === 0 && (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement de vos groupes...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
