
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import AppLayout from '@/components/AppLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const { userGroups, loading } = useGroups();

  const activeGroups = userGroups.filter(group =>
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const completedGroups = userGroups.filter(group =>
    group.status === 'completed'
  );

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 min-h-screen flex flex-col">
        <main className="flex-grow w-full flex items-center justify-center px-2 py-6 md:px-4 md:py-10">
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl md:text-3xl font-bold">R</span>
              </div>
            </div>
            <h1 className="text-xl md:text-3xl font-playfair font-bold mb-3 tracking-tight bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent drop-shadow-glow-gold">
              Random&nbsp;: Bienvenue {user?.user_metadata?.first_name ?? 'Aventurier'}
            </h1>
            <p className="text-base md:text-lg text-amber-900/80 mb-4 max-w-xl mx-auto leading-relaxed font-body font-normal">
              Vivez une expérience spontanée, raffinée et unique près de chez vous.<br className="hidden md:block" />
              Retrouvez vos groupes actifs et votre prochaine aventure – le tout en 1 clic.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 md:gap-4 w-full mb-3">
              {/* RandomButton conserve son style, mais sera plus petit */}
              <div className="w-full sm:w-auto"><RandomButton size="sm" /></div>
              <div className="rounded-2xl border border-amber-300 px-4 py-2 text-amber-700 text-xs md:text-sm font-medium font-heading bg-white/80 shadow-soft select-none cursor-default mt-2 sm:mt-0">
                {userGroups.length
                  ? `Groupes actifs : ${activeGroups.length} / Terminé : ${completedGroups.length}`
                  : "Aucun groupe actif"}
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-1 mb-2">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                  <span className="w-2 h-2 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                  Synchronisation en cours...
                </div>
              )}
              {!loading && userGroups.length === 0 && (
                <div className="text-amber-700 text-xs font-medium">
                  Démarrez votre première aventure – il suffit d’un clic sur le bouton ci-dessus.
                </div>
              )}
            </div>
            <div className="mt-4 max-w-xl mx-auto flex justify-center gap-4 text-[11px] md:text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                Groupes actifs
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                Bars partenaires
              </span>
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                Paris uniquement
              </span>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
