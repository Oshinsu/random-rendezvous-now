
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import GroupsList from '@/components/GroupsList';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavigation from '@/components/AppNavigation';

const GroupsPage = () => {
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">Mes Groupes</h1>
          </div>
          
          <Button
            onClick={fetchUserGroups}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Groupes actifs */}
        {activeGroups.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Groupes Actifs</h2>
            <GroupsList
              groups={activeGroups}
              title=""
              emptyMessage="Aucun groupe actif"
            />
          </div>
        )}

        {/* Historique */}
        {completedGroups.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Historique</h2>
            <GroupsList
              groups={completedGroups}
              title=""
              emptyMessage="Aucune aventure passée"
              showLeaveButton={false}
            />
          </div>
        )}

        {/* État vide */}
        {userGroups.length === 0 && !loading && (
          <div className="text-center py-16 space-y-4">
            <div className="text-8xl">🎲</div>
            <h3 className="text-2xl font-bold">Aucun groupe pour le moment</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vous n'avez pas encore rejoint de groupe. Retournez au dashboard pour commencer votre première aventure Random !
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="mt-4">
                Rejoindre un groupe
              </Button>
            </Link>
          </div>
        )}

        {/* Loading state */}
        {loading && userGroups.length === 0 && (
          <div className="text-center py-16">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Chargement de vos groupes...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
