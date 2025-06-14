
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
      <div className="min-h-full bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 flex flex-col items-center py-8 px-2">
        <div className="w-full max-w-md">
          {/* Logo-titre simple */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow">
              <span className="text-white text-xl font-bold font-playfair">R</span>
            </div>
            <h1 className="text-xl md:text-2xl font-playfair font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent drop-shadow-glow-gold">
              Random
            </h1>
          </div>

          {/* Sous-titre */}
          <div className="text-center mb-7">
            <div className="font-heading text-[15px] text-neutral-800 font-semibold mb-1">
              Bienvenue {user?.user_metadata?.first_name ?? 'Aventurier'}
            </div>
            <p className="text-xs text-amber-900/80 font-body">
              Vivez une expérience spontanée et unique près de chez vous.
            </p>
          </div>

          {/* Random Button, version compacte */}
          <div className="mb-6">
            <RandomButton size="sm" />
          </div>

          {/* Statistiques groupes */}
          <div className="flex items-center justify-between bg-white/80 rounded-xl shadow border border-amber-200 px-4 py-3 mb-4">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-neutral-600 uppercase">Actifs</span>
              <span className="text-lg font-display font-bold text-blue-600">{activeGroups.length}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-neutral-600 uppercase">Terminé</span>
              <span className="text-lg font-display font-bold text-emerald-600">{completedGroups.length}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium text-neutral-600 uppercase">Total</span>
              <span className="text-lg font-display font-bold text-amber-700">{userGroups.length}</span>
            </div>
          </div>

          {/* Message d’état des groupes */}
          <div className="mb-2 text-center">
            {loading ? (
              <div className="flex justify-center items-center gap-2 text-xs text-amber-700 font-medium">
                <span className="w-2 h-2 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                Synchronisation en cours...
              </div>
            ) : userGroups.length === 0 ? (
              <div className="text-amber-700 text-xs font-medium">
                Démarrez votre première aventure en un clic.
              </div>
            ) : (
              <div className="text-xs text-neutral-700">{activeGroups.length > 0 ? 'Vous avez des groupes en attente !' : 'Aucune aventure en cours.'}</div>
            )}
          </div>

          {/* Légende simplifiée */}
          <div className="flex justify-center gap-3 text-[11px] text-muted-foreground mt-4">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Actifs
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Terminé
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Paris
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

