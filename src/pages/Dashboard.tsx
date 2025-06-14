
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
        <main className="flex-grow w-full flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">R</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-playfair font-extrabold mb-6 tracking-tight bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent drop-shadow-glow-gold">
              Random : Bienvenue {user?.user_metadata?.first_name ?? 'Aventurier'}
            </h1>
            <p className="text-lg md:text-xl text-amber-900/80 mb-8 max-w-2xl mx-auto leading-relaxed font-body font-medium">
              Vivez une expérience spontanée, raffinée et unique près de chez vous.<br className="hidden md:block" />
              Retrouvez vos groupes actifs et votre prochaine aventure – le tout en 1 clic.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full mb-6">
              <RandomButton />
              <div className="rounded-2xl border border-amber-300 px-6 py-3 text-amber-700 text-base font-semibold font-heading bg-white/80 shadow-soft select-none cursor-default mt-2 sm:mt-0">
                {userGroups.length
                  ? `Groupes actifs : ${activeGroups.length} / Terminé : ${completedGroups.length}`
                  : "Aucun groupe actif"}
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2 mb-4">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-amber-700 font-medium">
                  <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                  Synchronisation en cours...
                </div>
              )}
              {!loading && userGroups.length === 0 && (
                <div className="text-amber-700 text-sm font-medium">
                  Démarrez votre première aventure – il suffit d’un clic sur le bouton ci-dessus.
                </div>
              )}
            </div>
            <div className="mt-6 max-w-xl mx-auto flex justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Groupes actifs
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                Bars partenaires
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
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

