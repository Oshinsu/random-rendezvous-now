
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import RandomButton from '@/components/RandomButton';
import GroupsList from '@/components/GroupsList';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { userGroups, loading, fetchUserGroups } = useGroups();

  // Supprimer l'effet qui cause des appels répétés
  // Le hook useGroups gère déjà le chargement initial

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
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Section de bienvenue améliorée */}
        <div className="text-center space-y-6 glass-effect rounded-2xl p-8 border border-yellow-200">
          <div className="flex justify-center items-center space-x-4">
            <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                Bienvenue {user?.user_metadata?.first_name || 'Aventurier'} ! 🎉
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Prêt à vivre une nouvelle aventure parisienne ?
              </p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-600">
              Un simple clic et c'est parti pour découvrir de nouveaux bars, 
              rencontrer des personnes formidables et créer des souvenirs inoubliables !
            </p>
          </div>
        </div>

        {/* Bouton Random optimisé */}
        <div className="flex justify-center py-4">
          <RandomButton />
        </div>

        {/* Statistiques améliorées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-effect rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Groupes Actifs</p>
                <p className="text-3xl font-bold text-blue-600">{activeGroups.length}</p>
                <p className="text-xs text-blue-500">En cours ou en attente</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6 border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Aventures Complétées</p>
                <p className="text-3xl font-bold text-emerald-600">{completedGroups.length}</p>
                <p className="text-xs text-emerald-500">Missions accomplies</p>
              </div>
            </div>
          </div>
          
          <div className="glass-effect rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Aventures</p>
                <p className="text-3xl font-bold text-purple-600">{userGroups.length}</p>
                <p className="text-xs text-purple-500">Votre score global</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Groupes optimisée */}
        {userGroups.length > 0 ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-6 w-6 text-gold" />
                  Mes Groupes d'Aventure
                </h2>
                <p className="text-gray-600 mt-1">Gérez vos aventures en cours et passées</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="border-2 hover:border-gold hover:text-gold transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <Link to="/groups">
                  <Button variant="default" size="sm" className="gold-gradient">
                    <Users className="h-4 w-4 mr-2" />
                    Voir tout
                  </Button>
                </Link>
              </div>
            </div>

            {activeGroups.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
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
                      <Button variant="outline" size="sm">
                        Voir {activeGroups.length - 2} groupe{activeGroups.length - 2 > 1 ? 's' : ''} de plus
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 space-y-6 glass-effect rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-8xl animate-bounce">🎲</div>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-gray-800">Votre première aventure vous attend !</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                Cliquez sur le bouton "Lancer l'Aventure" ci-dessus pour rejoindre votre premier groupe et commencer l'aventure.
              </p>
              <div className="flex justify-center space-x-4 text-sm text-gray-500">
                <span>🌟 Rencontres authentiques</span>
                <span>🍸 Bars secrets</span>
                <span>🎯 Groupes de 5</span>
              </div>
            </div>
          </div>
        )}

        {/* Indicateur de chargement amélioré */}
        {loading && (
          <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full p-4 border border-gray-200">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 animate-spin text-gold" />
              <span className="text-sm font-medium text-gray-700">Mise à jour...</span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
