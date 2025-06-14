
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { userGroups, loading, fetchUserGroups } = useGroups();

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const completedGroups = userGroups.filter(group => 
    group.status === 'completed'
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-8 w-8 text-amber-500" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
              Salut {user?.user_metadata?.first_name || 'RandomUser'} !
            </h1>
            <Sparkles className="h-8 w-8 text-amber-500" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Prêt à vivre une nouvelle aventure Random ? Un simple clic et c'est parti pour découvrir de nouveaux bars et rencontrer des gens formidables !
          </p>
        </div>

        {/* Random Button */}
        <div className="flex justify-center">
          <RandomButton />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Groupes Actifs</p>
                <p className="text-2xl font-bold text-amber-700">{activeGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Aventures Complétées</p>
                <p className="text-2xl font-bold text-emerald-700">{completedGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Aventures</p>
                <p className="text-2xl font-bold text-purple-700">{userGroups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-heading font-bold text-gray-800">Aperçu de mes groupes</h2>
            <div className="flex space-x-2">
              <Button
                onClick={fetchUserGroups}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Link to="/groups">
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                  <Users className="h-4 w-4 mr-2" />
                  Voir tous
                </Button>
              </Link>
            </div>
          </div>

          {activeGroups.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Groupes Actifs</h3>
              <GroupsList
                groups={activeGroups.slice(0, 2)}
                title=""
                emptyMessage="Aucun groupe actif"
              />
              {activeGroups.length > 2 && (
                <div className="text-center">
                  <Link to="/groups">
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      Voir les {activeGroups.length - 2} autres groupes
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {userGroups.length === 0 && !loading && (
            <div className="text-center py-12 space-y-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-amber-200/50">
              <div className="text-6xl">🎲</div>
              <h3 className="text-2xl font-bold text-gray-800">Votre première aventure vous attend !</h3>
              <p className="text-gray-600">
                Cliquez sur le bouton Random ci-dessus pour rejoindre votre premier groupe.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
