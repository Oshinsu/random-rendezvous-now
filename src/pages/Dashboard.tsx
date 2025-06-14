
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Sparkles, Trophy, TrendingUp, Clock, Zap, Star, ArrowRight } from 'lucide-react';
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
        <div className="container mx-auto px-6 py-8 space-y-8 max-w-6xl">
          {/* Section de bienvenue raffinée */}
          <div className="text-center space-y-6 card-modern animate-in">
            <div className="flex justify-center items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-medium animate-float">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold gradient-text">
                  Hey {user?.user_metadata?.first_name || 'Aventurier'} ! 👋
                </h1>
                <p className="text-lg font-heading text-neutral-600 mt-2 font-medium">
                  Ta prochaine aventure parisienne t'attend
                </p>
              </div>
            </div>
            
            <p className="text-base font-body text-neutral-700 max-w-2xl mx-auto leading-relaxed">
              Découvre des lieux secrets, rencontre des gens passionnants et crée des souvenirs mémorables. 
              <span className="font-semibold text-brand-600"> L'aventure commence maintenant.</span>
            </p>
          </div>

          {/* Bouton Random centré */}
          <div className="flex justify-center animate-up" style={{ animationDelay: '0.2s' }}>
            <RandomButton />
          </div>

          {/* Statistiques compactes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-up" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border-l-4 border-l-blue-500 hover:scale-105 transition-all duration-300">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-medium">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-heading font-bold text-neutral-500 uppercase tracking-wider">En cours</p>
                <p className="text-2xl font-display font-bold text-blue-600">{activeGroups.length}</p>
                <p className="text-xs font-body text-blue-500 font-medium">aventures actives</p>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border-l-4 border-l-emerald-500 hover:scale-105 transition-all duration-300">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-medium">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-heading font-bold text-neutral-500 uppercase tracking-wider">Terminées</p>
                <p className="text-2xl font-display font-bold text-emerald-600">{completedGroups.length}</p>
                <p className="text-xs font-body text-emerald-500 font-medium">expériences vécues</p>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 flex items-center gap-4 border-l-4 border-l-purple-500 hover:scale-105 transition-all duration-300">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-medium">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-heading font-bold text-neutral-500 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-display font-bold text-purple-600">{userGroups.length}</p>
                <p className="text-xs font-body text-purple-500 font-medium">moments partagés</p>
              </div>
            </div>
          </div>

          {/* Section Groupes optimisée */}
          {userGroups.length > 0 ? (
            <div className="space-y-6 animate-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex justify-between items-center glass-card rounded-2xl p-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-neutral-800 flex items-center gap-3">
                    <Users className="h-6 w-6 text-brand-600" />
                    Mes Aventures
                  </h2>
                  <p className="font-body text-neutral-600 mt-1 text-sm">Gère tes expériences et découvre de nouveaux horizons</p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="font-heading hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-medium"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Link to="/groups">
                    <Button 
                      size="sm" 
                      className="font-heading hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-glow group"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Tout voir
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </div>
              </div>

              {activeGroups.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-glow"></div>
                    <h3 className="font-heading text-lg font-bold text-neutral-700">
                      Aventures en cours ({activeGroups.length})
                    </h3>
                  </div>
                  <GroupsList
                    groups={activeGroups.slice(0, 2)}
                    title=""
                    emptyMessage="Aucune aventure active"
                  />
                  {activeGroups.length > 2 && (
                    <div className="text-center pt-4">
                      <Link to="/groups">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-heading hover:scale-105 active:scale-95 transition-all duration-200 hover:shadow-medium group"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Voir {activeGroups.length - 2} aventure{activeGroups.length - 2 > 1 ? 's' : ''} de plus
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 space-y-6 glass-card rounded-2xl animate-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-6xl animate-float">🎯</div>
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold text-neutral-800">Ton aventure commence ici</h3>
                <p className="font-body text-neutral-600 text-base max-w-xl mx-auto leading-relaxed">
                  Prêt à sortir de ta zone de confort ? Un simple clic suffit pour rejoindre ta première bande d'aventuriers parisiens.
                </p>
                <div className="flex justify-center space-x-6 text-sm font-heading text-neutral-500 font-semibold pt-2">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-500" />
                    Rencontres authentiques
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-500" />
                    5 personnes max
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-500" />
                    2h d'évasion
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed bottom-6 right-6 glass-morphism shadow-strong rounded-2xl p-4 border border-brand-200">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 animate-spin text-brand-600" />
                <span className="font-heading font-semibold text-neutral-700 text-sm">Synchronisation...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
