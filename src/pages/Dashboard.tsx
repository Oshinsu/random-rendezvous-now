
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppNavigation from '@/components/AppNavigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users } from 'lucide-react';
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
    group.status === 'waiting' || group.status === 'full' || group.status === 'confirmed'
  );

  const completedGroups = userGroups.filter(group => 
    group.status === 'completed'
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold">
            Salut {user?.user_metadata?.first_name || 'RandomUser'} ! 👋
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Prêt à vivre une nouvelle aventure Random ? Un simple clic et c'est parti !
          </p>
        </div>

        {/* Random Button */}
        <div className="flex justify-center">
          <RandomButton />
        </div>

        {/* Groups Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-heading font-bold">Aperçu de mes groupes</h2>
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
              <h3 className="text-lg font-semibold text-muted-foreground">Groupes Actifs</h3>
              <GroupsList
                groups={activeGroups.slice(0, 2)}
                title=""
                emptyMessage="Aucun groupe actif"
              />
              {activeGroups.length > 2 && (
                <div className="text-center">
                  <Link to="/groups">
                    <Button variant="outline">
                      Voir les {activeGroups.length - 2} autres groupes
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {userGroups.length === 0 && !loading && (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">🎲</div>
              <h3 className="text-2xl font-bold">Votre première aventure vous attend !</h3>
              <p className="text-muted-foreground">
                Cliquez sur le bouton Random ci-dessus pour rejoindre votre premier groupe.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
