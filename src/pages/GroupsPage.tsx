
import { useGroups } from '@/hooks/useGroups';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Trophy, Clock, Sparkles } from 'lucide-react';
import RandomButton from '@/components/RandomButton';

const GroupsPage = () => {
  const { userGroups, loading, fetchUserGroups } = useGroups();

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const completedGroups = userGroups.filter(group => 
    group.status === 'completed'
  );

  const handleRefresh = () => {
    console.log('🔄 Refresh manuel des groupes (page Groups)');
    fetchUserGroups();
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-slate-50 to-amber-50/30">
        <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
          {/* En-tête de page */}
          <div className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 shadow-lg">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                <Users className="h-10 w-10 text-amber-600" />
                Mes Groupes
              </h1>
              <p className="text-xl text-slate-600 mt-2 font-medium">Gérez vos aventures passées et à venir</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              size="lg"
              className="border-2 border-slate-300 hover:border-amber-500 hover:text-amber-600 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Section nouvelle aventure */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="h-7 w-7 text-amber-600" />
                Nouvelle Aventure
              </h2>
              <p className="text-slate-600 font-medium">Rejoins un nouveau groupe dès maintenant</p>
            </div>
            <RandomButton />
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 shadow-lg">
              <div className="flex items-center space-x-4">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600 font-medium uppercase tracking-wide">Groupes Actifs</p>
                  <p className="text-3xl font-bold text-blue-600">{activeGroups.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/50 shadow-lg">
              <div className="flex items-center space-x-4">
                <Trophy className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-slate-600 font-medium uppercase tracking-wide">Complétées</p>
                  <p className="text-3xl font-bold text-emerald-600">{completedGroups.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-amber-200/50 shadow-lg">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-slate-600 font-medium uppercase tracking-wide">Total</p>
                  <p className="text-3xl font-bold text-amber-600">{userGroups.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Groupes actifs */}
          {activeGroups.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                <Clock className="h-6 w-6 text-blue-600" />
                Groupes Actifs
              </h2>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 shadow-lg">
                <GroupsList
                  groups={activeGroups}
                  title=""
                  emptyMessage="Aucun groupe actif"
                />
              </div>
            </div>
          )}

          {/* Groupes complétés */}
          {completedGroups.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                <Trophy className="h-6 w-6 text-emerald-600" />
                Aventures Complétées
              </h2>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/50 shadow-lg">
                <GroupsList
                  groups={completedGroups}
                  title=""
                  emptyMessage="Aucune aventure complétée"
                />
              </div>
            </div>
          )}

          {/* État vide */}
          {userGroups.length === 0 && !loading && (
            <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-300 shadow-lg">
              <div className="text-8xl mb-6">🎯</div>
              <h3 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Commencez votre aventure</h3>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Vous n'avez pas encore rejoint de groupe. Cliquez sur le bouton ci-dessus pour commencer !
              </p>
            </div>
          )}

          {/* Chargement */}
          {loading && userGroups.length === 0 && (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-slate-600">Chargement de vos groupes...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
