
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Sparkles, Trophy, TrendingUp, Clock, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { userGroups, loading, fetchUserGroups } = useGroups();

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const completedGroups = userGroups.filter(group => 
    group.status === 'completed'
  );

  const handleRefresh = () => {
    console.log('🔄 Refresh manuel des groupes');
    fetchUserGroups();
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-neutral-50 to-brand-50">
        <div className="container mx-auto px-8 py-12 space-y-12 max-w-7xl">
          {/* Section de bienvenue moderne */}
          <div className="text-center space-y-8 card-modern animate-in">
            <div className="flex justify-center items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl flex items-center justify-center shadow-glow animate-float">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="font-display text-5xl font-bold gradient-text">
                  Salut {user?.user_metadata?.first_name || 'Aventurier'} !
                </h1>
                <p className="text-xl font-heading text-neutral-600 mt-3 font-medium">
                  Prêt pour une nouvelle aventure parisienne ?
                </p>
              </div>
            </div>
            
            <p className="text-lg font-body text-neutral-700 max-w-3xl mx-auto leading-relaxed">
              Découvrez de nouveaux bars secrets, rencontrez des personnes formidables 
              et créez des souvenirs inoubliables en un simple clic !
            </p>
          </div>

          {/* Bouton Random moderne */}
          <div className="flex justify-center animate-up" style={{ animationDelay: '0.2s' }}>
            <RandomButton />
          </div>

          {/* Statistiques modernes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-up" style={{ animationDelay: '0.4s' }}>
            <div className="stat-card border-l-blue-500">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-medium">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="text-sm font-heading font-bold text-neutral-500 uppercase tracking-wider">Groupes Actifs</p>
                <p className="text-4xl font-display font-bold text-blue-600 mt-1">{activeGroups.length}</p>
                <p className="text-sm font-body text-blue-500 font-medium mt-1">En cours de formation</p>
              </div>
            </div>
            
            <div className="stat-card border-l-emerald-500">
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-medium">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="text-sm font-heading font-bold text-neutral-500 uppercase tracking-wider">Aventures Complétées</p>
                <p className="text-4xl font-display font-bold text-emerald-600 mt-1">{completedGroups.length}</p>
                <p className="text-sm font-body text-emerald-500 font-medium mt-1">Missions accomplies</p>
              </div>
            </div>
            
            <div className="stat-card border-l-purple-500">
              <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-medium">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="text-sm font-heading font-bold text-neutral-500 uppercase tracking-wider">Total Aventures</p>
                <p className="text-4xl font-display font-bold text-purple-600 mt-1">{userGroups.length}</p>
                <p className="text-sm font-body text-purple-500 font-medium mt-1">Expériences vécues</p>
              </div>
            </div>
          </div>

          {/* Section Groupes moderne */}
          {userGroups.length > 0 ? (
            <div className="space-y-8 animate-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex justify-between items-center card-modern">
                <div>
                  <h2 className="font-display text-3xl font-bold text-neutral-800 flex items-center gap-4">
                    <Users className="h-8 w-8 text-brand-600" />
                    Mes Aventures
                  </h2>
                  <p className="font-body text-neutral-600 mt-2 text-lg">Gérez vos expériences en cours et passées</p>
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="font-heading"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Link to="/groups">
                    <Button size="sm" className="font-heading">
                      <Users className="h-4 w-4 mr-2" />
                      Voir tout
                    </Button>
                  </Link>
                </div>
              </div>

              {activeGroups.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-glow"></div>
                    <h3 className="font-heading text-xl font-bold text-neutral-700">
                      Groupes Actifs ({activeGroups.length})
                    </h3>
                  </div>
                  <GroupsList
                    groups={activeGroups.slice(0, 2)}
                    title=""
                    emptyMessage="Aucun groupe actif"
                  />
                  {activeGroups.length > 2 && (
                    <div className="text-center pt-6">
                      <Link to="/groups">
                        <Button variant="outline" size="sm" className="font-heading">
                          <Star className="h-4 w-4 mr-2" />
                          Voir {activeGroups.length - 2} groupe{activeGroups.length - 2 > 1 ? 's' : ''} de plus
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 space-y-8 card-modern animate-up" style={{ animationDelay: '0.6s' }}>
              <div className="text-8xl animate-float">🎲</div>
              <div className="space-y-6">
                <h3 className="font-display text-4xl font-bold text-neutral-800">Votre première aventure vous attend !</h3>
                <p className="font-body text-neutral-600 text-xl max-w-2xl mx-auto leading-relaxed">
                  Cliquez sur le bouton "Lancer l'Aventure" ci-dessus pour rejoindre votre premier groupe d'aventuriers.
                </p>
                <div className="flex justify-center space-x-8 text-sm font-heading text-neutral-500 font-semibold">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-500" />
                    Rencontres authentiques
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-500" />
                    Groupes de 5
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-brand-500" />
                    2h d'aventure
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed bottom-8 right-8 glass-morphism shadow-strong rounded-3xl p-6 border border-brand-200">
              <div className="flex items-center space-x-4">
                <RefreshCw className="h-6 w-6 animate-spin text-brand-600" />
                <span className="font-heading font-semibold text-neutral-700">Mise à jour...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
