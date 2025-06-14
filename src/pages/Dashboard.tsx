
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Trophy, TrendingUp, Clock, Zap, Star, ArrowRight, Sparkles } from 'lucide-react';
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
          {/* Section de bienvenue optimisée */}
          <div className="text-center space-y-4 glass-card rounded-xl p-6 animate-in">
            <div className="flex justify-center items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  Bienvenue {user?.user_metadata?.first_name || 'Aventurier'}
                </h1>
                <p className="text-sm text-neutral-600 mt-1 font-heading">
                  Votre prochaine aventure vous attend
                </p>
              </div>
            </div>
            
            <p className="text-sm text-neutral-700 max-w-xl mx-auto font-body leading-relaxed">
              Rejoignez des groupes près de chez vous et découvrez de nouveaux lieux avec des personnes partageant vos envies d'exploration.
            </p>
          </div>

          {/* Bouton Random centré */}
          <div className="flex justify-center animate-up" style={{ animationDelay: '0.1s' }}>
            <RandomButton />
          </div>

          {/* Statistiques avec icônes blanc/or */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-blue-500 hover:scale-105 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide font-heading">Aventures Actives</p>
                <p className="text-xl font-bold text-blue-600 font-display">{activeGroups.length}</p>
                <p className="text-xs text-blue-500 font-body">expériences en cours</p>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-emerald-500 hover:scale-105 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide font-heading">Accomplies</p>
                <p className="text-xl font-bold text-emerald-600 font-display">{completedGroups.length}</p>
                <p className="text-xs text-emerald-500 font-body">souvenirs créés</p>
              </div>
            </div>
            
            <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-l-4 border-l-purple-500 hover:scale-105 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide font-heading">Expérience Totale</p>
                <p className="text-xl font-bold text-purple-600 font-display">{userGroups.length}</p>
                <p className="text-xs text-purple-500 font-body">rencontres uniques</p>
              </div>
            </div>
          </div>

          {/* Section Groupes optimisée */}
          {userGroups.length > 0 ? (
            <div className="space-y-4 animate-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-between items-center glass-card rounded-xl p-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-neutral-800 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Vos Aventures
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1 font-body">Gérez vos expériences de découverte</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="text-xs hover:scale-105 active:scale-95 transition-all duration-200 font-heading"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Link to="/groups">
                    <Button 
                      size="sm" 
                      className="text-xs hover:scale-105 active:scale-95 transition-all duration-200 group bg-gradient-to-r from-amber-500 to-amber-600 font-heading"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Tout explorer
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </div>
              </div>

              {activeGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-base font-heading font-semibold text-neutral-700">
                      Expériences Actives ({activeGroups.length})
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
                          className="text-xs hover:scale-105 active:scale-95 transition-all duration-200 group font-heading"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Découvrir {activeGroups.length - 2} autres aventures
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
              <div className="text-4xl">⚡</div>
              <div className="space-y-3">
                <h3 className="text-xl font-display font-bold text-neutral-800">Lancez votre première aventure</h3>
                <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed font-body">
                  Un simple clic vous connecte à un groupe de 5 personnes pour une expérience de découverte inoubliable.
                </p>
                <div className="flex justify-center space-x-4 text-xs text-neutral-500 pt-2">
                  <span className="flex items-center gap-1 font-body">
                    <div className="p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                    5 personnes maximum
                  </span>
                  <span className="flex items-center gap-1 font-body">
                    <div className="p-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                    2h de découverte
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed bottom-6 right-6 glass-morphism shadow-lg rounded-xl p-3 border border-brand-200">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-brand-600" />
                <span className="text-xs font-medium text-neutral-700 font-body">Synchronisation en cours...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
