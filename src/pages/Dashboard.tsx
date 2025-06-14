
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
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800">
            Salut {user?.user_metadata?.first_name || 'RandomUser'} !
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Prêt à vivre une nouvelle aventure ? Un simple clic et c'est parti pour découvrir de nouveaux bars !
          </p>
        </div>

        {/* Random Button */}
        <div className="flex justify-center py-8">
          <RandomButton />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 gold-gradient rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Groupes Actifs</p>
                <p className="text-2xl font-bold text-gold">{activeGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aventures Complétées</p>
                <p className="text-2xl font-bold text-emerald-600">{completedGroups.length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500 rounded-lg">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-purple-600">{userGroups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Groups Section */}
        {userGroups.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Mes Groupes</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={fetchUserGroups}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Link to="/groups">
                  <Button variant="outline" size="sm">
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
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4 glass-effect rounded-2xl">
            <div className="text-6xl">🎲</div>
            <h3 className="text-2xl font-bold text-gray-800">Votre première aventure vous attend !</h3>
            <p className="text-gray-600">
              Cliquez sur le bouton ci-dessus pour rejoindre votre premier groupe.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
