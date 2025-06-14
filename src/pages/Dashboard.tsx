
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import AppLayout from '@/components/AppLayout';
import { Trophy, Clock, Star, Users, ArrowRight, Sparkles } from 'lucide-react';

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
      <div className="min-h-full bg-gradient-to-br from-[#fffbe8] via-[#fef6e2] to-brand-50 transition-all duration-500">
        <div className="container mx-auto px-6 py-10 space-y-10 max-w-5xl">
          <div className="text-center space-y-4 glass-card rounded-3xl p-8 animate-in">
            <div className="flex justify-center items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400/90 to-amber-500/90 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="font-playfair text-4xl font-bold text-[#c8a42d] drop-shadow-glow-gold">
              Bienvenue {user?.user_metadata?.first_name ?? 'Aventurier'}
            </h1>
            <p className="text-lg text-neutral-500 font-body">
              Vivez une expérience spontanée, raffinée et unique près de chez vous.
            </p>
          </div>

          <div className="flex justify-center animate-up" style={{ animationDelay: '0.05s' }}>
            <RandomButton />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-up" style={{ animationDelay: '0.15s' }}>
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 border-l-4 border-l-amber-400 shadow-sm">
              <div className="p-3 bg-gradient-to-br from-amber-400/95 to-amber-600/90 rounded-xl shadow">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <p className="text-xs font-playfair text-amber-700 uppercase tracking-wide">Aventures Actives</p>
              <p className="text-2xl font-bold text-[#c8a42d] font-playfair">{activeGroups.length}</p>
            </div>
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 border-l-4 border-l-amber-200 shadow-sm">
              <div className="p-3 bg-gradient-to-br from-amber-400/95 to-amber-600/90 rounded-xl shadow">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <p className="text-xs font-playfair text-amber-700 uppercase tracking-wide">Accomplies</p>
              <p className="text-2xl font-bold text-[#c8a42d] font-playfair">{completedGroups.length}</p>
            </div>
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 border-l-4 border-l-amber-100 shadow-sm">
              <div className="p-3 bg-gradient-to-br from-amber-400/95 to-amber-600/90 rounded-xl shadow">
                <Users className="h-7 w-7 text-white" />
              </div>
              <p className="text-xs font-playfair text-amber-700 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-[#c8a42d] font-playfair">{userGroups.length}</p>
            </div>
          </div>

          {!userGroups.length ? (
            <div className="text-center py-12 space-y-6 glass-card rounded-3xl animate-up" style={{ animationDelay: '0.22s' }}>
              <div className="text-4xl">⚡</div>
              <h2 className="font-playfair text-2xl text-[#c8a42d] font-bold">Démarrez votre première aventure</h2>
              <p className="text-neutral-500 max-w-md mx-auto leading-relaxed font-body">
                Un seul clic vous connecte à un groupe raffiné pour découvrir un lieu exclusif, sans efforts.
              </p>
              <div className="flex justify-center space-x-8 text-sm text-neutral-500 pt-2">
                <span className="flex items-center gap-1 font-playfair">
                  <div className="p-1 bg-gradient-to-br from-amber-400 to-amber-600 rounded">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  5 max
                </span>
                <span className="flex items-center gap-1 font-playfair">
                  <div className="p-1 bg-gradient-to-br from-amber-400 to-amber-600 rounded">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  2h
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-up" style={{ animationDelay: '0.25s' }}>
              <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="font-playfair text-xl text-[#c8a42d] flex items-center gap-2">
                    <span className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </span>
                    Vos Aventures
                  </h2>
                  <p className="text-sm text-neutral-500 font-body mt-1">Retrouvez et gérez vos souvenirs.</p>
                </div>
                <div className="hidden">
                  {/* Supprime les boutons multiples, on garde l’action Random */}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed bottom-10 right-10 glass-morphism shadow-lg rounded-2xl p-4 border border-amber-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin text-[#c8a42d]" />
                <span className="text-sm font-playfair text-neutral-700">Synchronisation en cours...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
