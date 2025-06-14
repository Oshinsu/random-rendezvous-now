
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Sparkles, Trophy, TrendingUp, Clock } from 'lucide-react';
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
      <div className="min-h-full bg-gradient-to-br from-slate-50 to-amber-50/30">
        <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
          {/* Section de bienvenue */}
          <div className="text-center space-y-6 bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 shadow-lg">
            <div className="flex justify-center items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                  Bonjour {user?.user_metadata?.first_name || 'Aventurier'} !
                </h1>
                <p className="text-xl text-slate-600 mt-2 font-medium">
                  Prêt pour une nouvelle aventure parisienne ?
                </p>
              </div>
            </div>
            
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Découvrez de nouveaux bars secrets, rencontrez des personnes formidables 
              et créez des souvenirs inoubliables en un simple clic !
            </p>
          </div>

          {/* Bouton Random */}
          <div className="flex justify-center">
            <RandomButton />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium uppercase tracking-wide">Groupes Actifs</p>
                  <p className="text-3xl font-bold text-blue-600">{activeGroups.length}</p>
                  <p className="text-xs text-blue-500 font-medium">En cours</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                  <Trophy className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium uppercase tracking-wide">Complétées</p>
                  <p className="text-3xl font-bold text-emerald-600">{completedGroups.length}</p>
                  <p className="text-xs text-emerald-500 font-medium">Missions accomplies</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium uppercase tracking-wide">Total</p>
                  <p className="text-3xl font-bold text-purple-600">{userGroups.length}</p>
                  <p className="text-xs text-purple-500 font-medium">Aventures</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Groupes */}
          {userGroups.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 shadow-lg">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                    <Users className="h-7 w-7 text-amber-600" />
                    Mes Groupes d'Aventure
                  </h2>
                  <p className="text-slate-600 mt-1 font-medium">Gérez vos aventures en cours et passées</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="border-2 border-slate-300 hover:border-amber-500 hover:text-amber-600 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Link to="/groups">
                    <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md">
                      <Users className="h-4 w-4 mr-2" />
                      Voir tout
                    </Button>
                  </Link>
                </div>
              </div>

              {activeGroups.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 px-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    Groupes Actifs ({activeGroups.length})
                  </h3>
                  <GroupsList
                    groups={activeGroups.slice(0, 2)}
                    title=""
                    emptyMessage="Aucun groupe actif"
                  />
                  {activeGroups.length > 2 && (
                    <div className="text-center pt-4">
                      <Link to="/groups">
                        <Button variant="outline" size="sm" className="border-slate-300 hover:border-amber-500 hover:text-amber-600">
                          Voir {activeGroups.length - 2} groupe{activeGroups.length - 2 > 1 ? 's' : ''} de plus
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 space-y-6 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-300 shadow-lg">
              <div className="text-8xl animate-bounce">🎲</div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">Votre première aventure vous attend !</h3>
                <p className="text-slate-600 text-lg max-w-md mx-auto leading-relaxed">
                  Cliquez sur le bouton "Lancer l'Aventure" ci-dessus pour rejoindre votre premier groupe.
                </p>
                <div className="flex justify-center space-x-6 text-sm text-slate-500 font-medium">
                  <span>🌟 Rencontres authentiques</span>
                  <span>🍸 Bars secrets</span>
                  <span>🎯 Groupes de 5</span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed bottom-6 right-6 bg-white/90 backdrop-blur-sm shadow-xl rounded-full p-4 border border-amber-200">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
                <span className="text-sm font-medium text-slate-700">Mise à jour...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
