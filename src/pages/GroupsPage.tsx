
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
        <div className="container mx-auto px-2 py-6 max-w-2xl space-y-4">
          <div className="flex justify-between items-center rounded-xl bg-white/70 backdrop-blur-sm border border-amber-200/50 shadow-sm p-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
                <Users className="h-5 w-5 text-amber-600" />
                Mes Groupes
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-normal">Aventures passées et à venir</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-2 border-slate-300 hover:border-amber-500 hover:text-amber-600 transition-colors py-1 px-3 min-h-0 h-8 text-xs"
            >
              <RefreshCw className={`h-4 w-4 mr-0.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          <div className="rounded-xl bg-white/70 backdrop-blur-sm border border-amber-200/50 shadow-sm p-3">
            <div className="text-center mb-2">
              <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1 mb-1">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Nouvelle Aventure
              </h2>
              <p className="text-xs text-slate-600 font-normal">Nouveau groupe près de chez toi</p>
            </div>
            <div className="flex justify-center">
              <RandomButton size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="flex flex-col items-center bg-white/70 rounded-xl border border-blue-200/50 p-2 shadow">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wide">Actifs</span>
              <span className="text-md font-bold text-blue-600">{activeGroups.length}</span>
            </div>
            
            <div className="flex flex-col items-center bg-white/70 rounded-xl border border-emerald-200/50 p-2 shadow">
              <Trophy className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wide">Complétées</span>
              <span className="text-md font-bold text-emerald-600">{completedGroups.length}</span>
            </div>
            
            <div className="flex flex-col items-center bg-white/70 rounded-xl border border-amber-200/50 p-2 shadow">
              <Users className="h-4 w-4 text-amber-600" />
              <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wide">Total</span>
              <span className="text-md font-bold text-amber-600">{userGroups.length}</span>
            </div>
          </div>

          {activeGroups.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1 tracking-tight">
                <Clock className="h-4 w-4 text-blue-600" />
                Groupes Actifs
              </h2>
              <div className="rounded-xl bg-white/50 border border-blue-200/50 shadow-sm p-2">
                <GroupsList
                  groups={activeGroups}
                  title=""
                  emptyMessage="Aucun groupe actif"
                />
              </div>
            </div>
          )}

          {completedGroups.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1 tracking-tight">
                <Trophy className="h-4 w-4 text-emerald-600" />
                Aventures Complétées
              </h2>
              <div className="rounded-xl bg-white/50 border border-emerald-200/50 shadow-sm p-2">
                <GroupsList
                  groups={completedGroups}
                  title=""
                  emptyMessage="Aucune aventure complétée"
                />
              </div>
            </div>
          )}

          {userGroups.length === 0 && !loading && (
            <div className="text-center py-6 bg-white/70 rounded-xl border-2 border-dashed border-slate-300 shadow-sm">
              <div className="text-4xl mb-1">🎯</div>
              <h3 className="text-base font-bold text-slate-800 mb-0 tracking-tight">Commencez votre aventure</h3>
              <p className="text-xs text-slate-600 mb-0 max-w-xl mx-auto leading-normal">
                Vous n'avez pas encore rejoint de groupe. Cliquez sur le bouton ci-dessus pour commencer !
              </p>
            </div>
          )}

          {loading && userGroups.length === 0 && (
            <div className="text-center py-7">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-600">Chargement de vos groupes...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
