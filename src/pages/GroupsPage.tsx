
import { useEffect } from 'react';
import { useGroups } from '@/hooks/useGroups';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Trophy, Clock } from 'lucide-react';
import RandomButton from '@/components/RandomButton';

const GroupsPage = () => {
  const { userGroups, loading, fetchUserGroups } = useGroups();

  // Supprimer l'effet automatique - le hook useGroups gère déjà le chargement

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
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Mes Groupes</h1>
            <p className="text-xl text-gray-600 mt-2">Gérez vos aventures passées et à venir</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="glass-effect rounded-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Nouvelle Aventure</h2>
            <p className="text-gray-600">Rejoins un nouveau groupe dès maintenant</p>
          </div>
          <RandomButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Groupes Actifs</p>
                <p className="text-3xl font-bold text-blue-600">{activeGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Complétées</p>
                <p className="text-3xl font-bold text-emerald-600">{completedGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-gold" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gold">{userGroups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {activeGroups.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-blue-600" />
              Groupes Actifs
            </h2>
            <GroupsList
              groups={activeGroups}
              title=""
              emptyMessage="Aucun groupe actif"
            />
          </div>
        )}

        {completedGroups.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-emerald-600" />
              Aventures Complétées
            </h2>
            <GroupsList
              groups={completedGroups}
              title=""
              emptyMessage="Aucune aventure complétée"
            />
          </div>
        )}

        {userGroups.length === 0 && !loading && (
          <div className="text-center py-16 glass-effect rounded-2xl">
            <div className="text-8xl mb-6">🎯</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Commencez votre aventure</h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Vous n'avez pas encore rejoint de groupe. Cliquez sur le bouton ci-dessus pour commencer !
            </p>
          </div>
        )}

        {loading && userGroups.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Chargement de vos groupes...</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
