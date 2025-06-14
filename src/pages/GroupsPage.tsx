
import { useEffect } from 'react';
import { useGroups } from '@/hooks/useGroups';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Plus } from 'lucide-react';
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
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
              Mes Groupes
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez vos aventures Random et rejoignez de nouveaux groupes
            </p>
          </div>
          <Button
            onClick={fetchUserGroups}
            disabled={loading}
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Quick Action */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Nouvelle Aventure</h2>
              <p className="text-gray-600">Prêt pour une nouvelle aventure ? Rejoignez un groupe maintenant !</p>
            </div>
            <div className="ml-6">
              <RandomButton />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Groupes Actifs</p>
                <p className="text-2xl font-bold text-blue-700">{activeGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aventures Complétées</p>
                <p className="text-2xl font-bold text-green-700">{completedGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-purple-700">{userGroups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Groups */}
        {activeGroups.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading font-bold text-gray-800">Groupes Actifs</h2>
            <GroupsList
              groups={activeGroups}
              title=""
              emptyMessage="Aucun groupe actif"
            />
          </div>
        )}

        {/* Completed Groups */}
        {completedGroups.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading font-bold text-gray-800">Aventures Complétées</h2>
            <GroupsList
              groups={completedGroups}
              title=""
              emptyMessage="Aucune aventure complétée"
            />
          </div>
        )}

        {/* Empty State */}
        {userGroups.length === 0 && !loading && (
          <div className="text-center py-16 space-y-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-amber-200/50">
            <div className="text-8xl">🎲</div>
            <h3 className="text-3xl font-bold text-gray-800">Aucun groupe pour le moment</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Vous n'avez pas encore rejoint de groupe. Commencez votre première aventure Random dès maintenant !
            </p>
            <div className="pt-4">
              <RandomButton />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
