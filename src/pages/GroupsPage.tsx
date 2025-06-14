
import { useGroups } from '@/hooks/useGroups';
import GroupCard from '@/components/GroupCard';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Trophy, Clock, Sparkles, Star, MapPin } from 'lucide-react';
import RandomButton from '@/components/RandomButton';

const GroupsPage = () => {
  const { userGroups, loading, fetchUserGroups, leaveGroup, userLocation } = useGroups();

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
      <div className="min-h-full bg-gradient-to-br from-white via-brand-50/30 to-brand-100/20">
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300 mr-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                  Mes Aventures
                </h1>
              </div>
              <p className="text-xl text-neutral-600 font-body max-w-2xl mx-auto mb-8">
                Découvrez vos expériences passées et créez de nouveaux souvenirs avec des personnes formidables
              </p>
              
              {/* Actions Header */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <RandomButton size="lg" />
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  className="bg-white/50 backdrop-blur-sm border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400 transition-all duration-300 shadow-soft"
                  size="lg"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-soft border border-white/50 hover:shadow-medium transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-display font-bold text-blue-600 mb-2">{activeGroups.length}</div>
                <div className="text-blue-700 font-heading font-semibold">Aventures Actives</div>
                <div className="text-sm text-neutral-600 mt-1">En cours ou en attente</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-soft border border-white/50 hover:shadow-medium transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-display font-bold text-green-600 mb-2">{completedGroups.length}</div>
                <div className="text-green-700 font-heading font-semibold">Aventures Terminées</div>
                <div className="text-sm text-neutral-600 mt-1">Souvenirs créés</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-soft border border-white/50 hover:shadow-medium transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-display font-bold text-brand-600 mb-2">{userGroups.length}</div>
                <div className="text-brand-700 font-heading font-semibold">Total</div>
                <div className="text-sm text-neutral-600 mt-1">Toutes vos aventures</div>
              </div>
            </div>

            {/* Localisation si disponible */}
            {userLocation && (
              <div className="bg-gradient-to-r from-brand-500/10 to-brand-600/10 rounded-3xl p-6 mb-12 border border-brand-200/50">
                <div className="flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-brand-600 mr-3" />
                  <span className="text-brand-700 font-heading font-semibold">
                    Vous êtes près de {userLocation.locationName}
                  </span>
                </div>
              </div>
            )}

            {/* État de chargement */}
            {loading && userGroups.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-display font-bold text-neutral-800 mb-2">
                  Chargement de vos aventures...
                </h3>
                <p className="text-neutral-600 font-body">Cela ne prendra qu'un instant</p>
              </div>
            )}

            {/* État vide */}
            {userGroups.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <span className="text-6xl">🎯</span>
                </div>
                <h3 className="text-3xl font-display font-bold text-neutral-800 mb-4">
                  Votre première aventure vous attend !
                </h3>
                <p className="text-xl text-neutral-600 font-body mb-8 max-w-2xl mx-auto">
                  Rejoignez des groupes de personnes sympas près de chez vous et créez des souvenirs inoubliables
                </p>
                <div className="space-y-4">
                  <RandomButton size="lg" />
                  <p className="text-sm text-neutral-500">
                    🚀 En quelques secondes, vous serez connecté avec 4 autres personnes
                  </p>
                </div>
              </div>
            )}

            {/* Affichage des groupes */}
            {userGroups.length > 0 && (
              <div className="space-y-16">
                {/* Groupes actifs */}
                {activeGroups.length > 0 && (
                  <div>
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-neutral-800">
                          Aventures Actives
                        </h2>
                      </div>
                      <p className="text-neutral-600 font-body">
                        {activeGroups.length} aventure{activeGroups.length > 1 ? 's' : ''} en cours
                      </p>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-2">
                      {activeGroups.map((group) => (
                        <div key={group.id} className="transform hover:scale-[1.02] transition-all duration-300">
                          <GroupCard 
                            group={group} 
                            showLeaveButton={true}
                            leaveGroup={leaveGroup}
                            loading={loading}
                            userLocation={userLocation}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aventures terminées */}
                {completedGroups.length > 0 && (
                  <div>
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-3">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-neutral-800">
                          Aventures Terminées
                        </h2>
                      </div>
                      <p className="text-neutral-600 font-body">
                        {completedGroups.length} souvenir{completedGroups.length > 1 ? 's' : ''} créé{completedGroups.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-2">
                      {completedGroups.map((group) => (
                        <div key={group.id} className="transform hover:scale-[1.02] transition-all duration-300 opacity-75 hover:opacity-100">
                          <GroupCard 
                            group={group} 
                            showLeaveButton={false}
                            leaveGroup={leaveGroup}
                            loading={loading}
                            userLocation={userLocation}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA pour nouvelle aventure */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-3xl p-12 text-center text-white shadow-strong">
                  <Sparkles className="h-16 w-16 mx-auto mb-6 opacity-90" />
                  <h3 className="text-3xl font-display font-bold mb-4">
                    Prêt pour une nouvelle aventure ?
                  </h3>
                  <p className="text-xl text-brand-100 mb-8 font-body">
                    Rencontrez 4 nouvelles personnes et créez de nouveaux souvenirs dès aujourd'hui
                  </p>
                  <RandomButton size="lg" variant="secondary" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
