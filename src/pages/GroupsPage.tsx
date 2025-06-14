
import { useEffect } from 'react';
import { useGroups } from '@/hooks/useGroups';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Plus, Sparkles, Trophy, Clock, Crown, Gem, Star } from 'lucide-react';
import RandomButton from '@/components/RandomButton';

const GroupsPage = () => {
  const { userGroups, loading, fetchUserGroups } = useGroups();

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const completedGroups = userGroups.filter(group => 
    group.status === 'completed'
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50/30 to-yellow-100/20">
        <div className="container mx-auto px-8 py-12 space-y-12">
          {/* Header luxueux amélioré */}
          <div className="flex justify-between items-center">
            <div className="space-y-4">
              <h1 className="text-7xl font-luxury font-black bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-700 bg-clip-text text-transparent">
                Mes Expériences Exclusives
              </h1>
              <p className="text-2xl text-gray-700 font-elegant font-medium tracking-wide">
                Tes cercles premium et tes prochaines aventures de prestige
              </p>
            </div>
            <Button
              onClick={fetchUserGroups}
              disabled={loading}
              variant="outline"
              size="lg"
              className="border-3 border-yellow-400 text-yellow-800 hover:bg-yellow-50 hover:border-yellow-500 transition-all duration-300 font-elegant font-bold text-lg px-8 py-4"
            >
              <RefreshCw className={`h-6 w-6 mr-3 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Action principale luxueuse */}
          <div className="glass-luxury rounded-3xl border-2 border-yellow-200/50 p-12 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <Crown className="h-16 w-16 text-yellow-600 luxury-shimmer" />
                <h2 className="text-5xl font-luxury font-black text-gray-800">Prêt pour une Expérience Exclusive ?</h2>
                <Crown className="h-16 w-16 text-yellow-600 luxury-shimmer" />
              </div>
              <p className="text-2xl text-gray-700 font-elegant font-medium">Clique et laisse la magie premium opérer !</p>
            </div>
            <div className="flex justify-center">
              <RandomButton />
            </div>
          </div>

          {/* Stats premium améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-gold border-2 border-blue-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-center space-x-6">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl shadow-lg luxury-shimmer">
                  <Clock className="h-12 w-12 text-white" />
                </div>
                <div>
                  <p className="text-lg font-elegant font-bold text-blue-700 uppercase tracking-wider">Cercles Actifs</p>
                  <p className="text-6xl font-luxury font-black text-blue-800">{activeGroups.length}</p>
                  <p className="text-sm text-blue-600 font-elegant">En attente ou confirmés</p>
                </div>
              </div>
            </div>
            
            <div className="glass-gold border-2 border-emerald-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-center space-x-6">
                <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl shadow-lg luxury-shimmer">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
                <div>
                  <p className="text-lg font-elegant font-bold text-emerald-700 uppercase tracking-wider">Complétées</p>
                  <p className="text-6xl font-luxury font-black text-emerald-800">{completedGroups.length}</p>
                  <p className="text-sm text-emerald-600 font-elegant">Expériences terminées</p>
                </div>
              </div>
            </div>
            
            <div className="glass-gold border-2 border-purple-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
              <div className="flex items-center space-x-6">
                <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl shadow-lg luxury-shimmer">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <div>
                  <p className="text-lg font-elegant font-bold text-purple-700 uppercase tracking-wider">Total</p>
                  <p className="text-6xl font-luxury font-black text-purple-800">{userGroups.length}</p>
                  <p className="text-sm text-purple-600 font-elegant">Toutes expériences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Groupes actifs */}
          {activeGroups.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <Clock className="h-12 w-12 text-yellow-600" />
                <h2 className="text-5xl font-luxury font-black text-gray-800">Tes Cercles Actifs</h2>
              </div>
              <GroupsList
                groups={activeGroups}
                title=""
                emptyMessage="Aucun cercle actif"
              />
            </div>
          )}

          {/* Groupes complétés */}
          {completedGroups.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <Trophy className="h-12 w-12 text-emerald-600" />
                <h2 className="text-5xl font-luxury font-black text-gray-800">Tes Expériences Accomplies</h2>
              </div>
              <GroupsList
                groups={completedGroups}
                title=""
                emptyMessage="Aucune expérience complétée"
              />
            </div>
          )}

          {/* État vide luxueux amélioré */}
          {userGroups.length === 0 && !loading && (
            <div className="text-center py-24 space-y-12 glass-luxury rounded-3xl border-2 border-yellow-200/50 shadow-2xl">
              <div className="space-y-8">
                <div className="text-9xl luxury-float">👑</div>
                <h3 className="text-6xl font-luxury font-black text-gray-800">Prêt pour l'Expérience Premium ?</h3>
                <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-elegant">
                  Tu n'as pas encore rejoint de cercle exclusif. C'est le moment parfait pour commencer ta première aventure Premium ! 
                  Un clic, 5 membres d'élite, un établissement de prestige... L'expérience ultime t'attend !
                </p>
              </div>
              <div className="pt-8">
                <RandomButton />
              </div>
            </div>
          )}

          {/* Loading state luxueux */}
          {loading && userGroups.length === 0 && (
            <div className="text-center py-24">
              <div className="w-20 h-20 border-6 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-8 gold-glow"></div>
              <p className="text-3xl text-gray-700 font-luxury font-bold">Chargement de tes expériences premium...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
