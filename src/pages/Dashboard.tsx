
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Trophy, TrendingUp, Clock, Zap, Star, ArrowRight } from 'lucide-react';
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
        <div className="container mx-auto px-6 py-6 space-y-6 max-w-5xl">
          {/* Section de bienvenue simplifiée */}
          <div className="text-center space-y-4 glass-card rounded-xl p-6 animate-in">
            <div className="flex justify-center items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">
                  Salut {user?.user_metadata?.first_name || 'Aventurier'} ! 👋
                </h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Prêt pour ta prochaine aventure ?
                </p>
              </div>
            </div>
            
            <p className="text-sm text-neutral-700 max-w-xl mx-auto">
              Découvre Paris autrement, rencontre des gens cool et vis des moments uniques.
            </p>
          </div>

          {/* Bouton Random centré */}
          <div className="flex justify-center animate-up" style={{ animationDelay: '0.1s' }}>
            <RandomButton />
          </div>

          {/* Statistiques compactes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-blue-500 hover:scale-105 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">En cours</p>
                <p className="text-xl font-bold text-blue-600">{activeGroups.length}</p>
                <p className="text-xs text-blue-500">aventures actives</p>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-emerald-500 hover:scale-105 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Terminées</p>
                <p className="text-xl font-bold text-emerald-600">{completedGroups.length}</p>
                <p className="text-xs text-emerald-500">expériences vécues</p>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-purple-500 hover:scale-105 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Total</p>
                <p className="text-xl font-bold text-purple-600">{userGroups.length}</p>
                <p className="text-xs text-purple-500">moments partagés</p>
              </div>
            </div>
          </div>

          {/* Section Groupes optimisée */}
          {userGroups.length > 0 ? (
            <div className="space-y-4 animate-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-between items-center glass-card rounded-xl p-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-600" />
                    Mes Aventures
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1">Gère tes expériences parisienne</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="text-xs hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Link to="/groups">
                    <Button 
                      size="sm" 
                      className="text-xs hover:scale-105 active:scale-95 transition-all duration-200 group"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Tout voir
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </div>
              </div>

              {activeGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-base font-semibold text-neutral-700">
                      En cours ({activeGroups.length})
                    </h3>
                  </div>
                  <GroupsList
                    groups={activeGroups.slice(0, 2)}
                    title=""
                    emptyMessage="Aucune aventure active"
                  />
                  {activeGroups.length > 2 && (
                    <div className="text-center pt-3">
                      <Link to="/groups">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs hover:scale-105 active:scale-95 transition-all duration-200 group"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Voir {activeGroups.length - 2} de plus
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4 glass-card rounded-xl animate-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl">🎯</div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-neutral-800">C'est parti pour l'aventure !</h3>
                <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                  Un clic suffit pour rejoindre ta première bande d'aventuriers parisiens.
                </p>
                <div className="flex justify-center space-x-4 text-xs text-neutral-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-brand-500" />
                    5 personnes max
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-brand-500" />
                    2h d'évasion
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed bottom-6 right-6 glass-morphism shadow-lg rounded-xl p-3 border border-brand-200">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                <span className="text-xs font-medium text-neutral-700">Synchronisation...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
