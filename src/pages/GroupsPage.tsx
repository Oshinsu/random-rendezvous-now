
import { useGroups } from '@/hooks/useGroups';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, Users2, MapPin, Calendar, Clock, Settings, Hand } from 'lucide-react';
import GroupMembersList from '@/components/GroupMembersList';
import GroupMap from '@/components/GroupMap';
import GroupChat from '@/components/GroupChat';
import BarAssignmentButton from '@/components/BarAssignmentButton';

const GroupsPage = () => {
  const { userGroups, groupMembers, loading, fetchUserGroups, leaveGroup, userLocation } = useGroups();

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const handleRefresh = () => {
    console.log('🔄 Refresh manuel des groupes (page Groups)');
    fetchUserGroups();
  };

  // Pour le moment, on affiche le premier groupe actif
  const currentGroup = activeGroups[0];

  // Debug: Afficher les informations du groupe dans la console
  console.log('🔍 [GroupsPage] Groupe actuel:', currentGroup);
  console.log('🔍 [GroupsPage] userGroups:', userGroups);
  console.log('🔍 [GroupsPage] activeGroups:', activeGroups);
  console.log('🔍 [GroupsPage] loading:', loading);

  // CORRECTION: Un groupe est complet s'il a 5 participants, peu importe le statut
  const isGroupComplete = currentGroup?.current_participants >= 5;
  // Un groupe a besoin d'assignation de bar s'il est complet ET en statut confirmed mais sans bar
  const needsBarAssignment = isGroupComplete && currentGroup?.status === 'confirmed' && !currentGroup?.bar_name;
  // Un groupe peut afficher la carte s'il est complet (même sans bar assigné)
  const canShowMap = isGroupComplete;
  // Afficher le mudra si le groupe est complet ET a un bar assigné
  const shouldShowMudra = isGroupComplete && currentGroup?.bar_name;

  // Fonction pour obtenir l'adresse du bar ou une adresse par défaut
  const getBarAddress = () => {
    if (currentGroup?.bar_address) {
      return currentGroup.bar_address;
    }
    // Si on a des coordonnées mais pas d'adresse, afficher les coordonnées
    if (currentGroup?.bar_latitude && currentGroup?.bar_longitude) {
      return `Coordonnées: ${currentGroup.bar_latitude.toFixed(4)}, ${currentGroup.bar_longitude.toFixed(4)}`;
    }
    // Sinon, afficher un message d'attente
    return "Recherche de bar en cours...";
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-white via-brand-50/30 to-brand-100/20">
        <div className="px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            
            {/* État de chargement */}
            {loading && userGroups.length === 0 && (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-heading font-semibold text-neutral-800 mb-2">
                  Chargement en cours...
                </h3>
                <p className="text-sm text-neutral-600 font-body">Synchronisation avec votre groupe</p>
              </div>
            )}

            {/* Message quand pas de groupe actif - SANS RandomButton */}
            {!loading && !currentGroup && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users2 className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-heading font-bold text-neutral-800 mb-3">
                  Aucun groupe actif
                </h3>
                <p className="text-base text-neutral-600 font-body mb-6 max-w-lg mx-auto">
                  Vous devez d'abord rejoindre un groupe d'aventure pour accéder à cette section.
                </p>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 max-w-sm mx-auto mb-6">
                  <p className="text-amber-800 font-medium text-sm">
                    💡 Retournez au tableau de bord pour créer ou rejoindre une aventure
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="text-sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </div>
            )}

            {/* SEULEMENT afficher le contenu du groupe SI currentGroup existe */}
            {!loading && currentGroup && (
              <>
                {/* Header - seulement si on a un groupe actif */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-600 hover:text-neutral-800 p-2"
                      onClick={() => window.history.back()}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Retour
                    </Button>
                    <div>
                      <h1 className="text-xl font-heading font-bold text-neutral-800">
                        Votre Aventure
                      </h1>
                      <p className="text-sm text-neutral-600 font-body">
                        Suivez l'évolution en temps réel
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleRefresh}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="bg-white/50 backdrop-blur-sm border-brand-300 text-brand-700 hover:bg-brand-50 text-xs"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Actualiser
                    </Button>
                  </div>
                </div>

                {/* Affichage du groupe actif */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne gauche - Membres */}
                  <div className="space-y-6">
                    <GroupMembersList
                      members={groupMembers}
                      maxParticipants={currentGroup.max_participants}
                      currentParticipants={currentGroup.current_participants}
                    />
                    
                    {/* Chat du groupe */}
                    <GroupChat
                      groupId={currentGroup.id}
                      isGroupComplete={isGroupComplete}
                      barName={currentGroup.bar_name}
                    />
                  </div>

                  {/* Colonne droite - Carte et destination */}
                  <div className="space-y-6">
                    {/* Notification si bar pas assigné */}
                    {needsBarAssignment && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
                        <div className="text-center">
                          <h3 className="text-base font-heading font-semibold text-amber-800 mb-2">
                            🍺 Recherche de destination
                          </h3>
                          <p className="text-sm text-amber-700 mb-4">
                            Votre groupe est complet ! Trouvons le bar parfait pour votre aventure.
                          </p>
                          <BarAssignmentButton
                            groupId={currentGroup.id}
                            onBarAssigned={handleRefresh}
                            userLocation={userLocation}
                          />
                        </div>
                      </div>
                    )}

                    {/* Afficher la carte si le groupe est complet */}
                    {canShowMap && (
                      <GroupMap
                        barName={currentGroup.bar_name || "Destination en cours de sélection"}
                        barAddress={getBarAddress()}
                        meetingTime={currentGroup.meeting_time || new Date(Date.now() + 60 * 60 * 1000).toISOString()}
                        isGroupComplete={isGroupComplete}
                        barLatitude={currentGroup.bar_latitude}
                        barLongitude={currentGroup.bar_longitude}
                      />
                    )}

                    {/* Informations du groupe */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-white/50">
                      <h3 className="text-base font-heading font-semibold text-neutral-800 mb-4 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Détails de l'aventure
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600 font-medium">Statut</span>
                          <span className={`font-semibold text-xs px-2 py-1 rounded-full ${
                            currentGroup.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {currentGroup.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600 font-medium flex items-center gap-1">
                            <Users2 className="h-3 w-3" />
                            Participants
                          </span>
                          <span className="font-semibold text-neutral-800">
                            {currentGroup.current_participants}/{currentGroup.max_participants}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Créé le
                          </span>
                          <span className="font-medium text-neutral-800">
                            {new Date(currentGroup.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {currentGroup.location_name && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600 font-medium flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Zone
                            </span>
                            <span className="font-medium text-neutral-800">
                              {currentGroup.location_name}
                            </span>
                          </div>
                        )}
                        {/* Informations du bar si disponibles */}
                        {currentGroup.bar_name && (
                          <div className="border-t pt-3 mt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-600 font-medium">Destination</span>
                              <span className="font-semibold text-green-700 text-right max-w-32 truncate">
                                {currentGroup.bar_name}
                              </span>
                            </div>
                            {(currentGroup.bar_address || (currentGroup.bar_latitude && currentGroup.bar_longitude)) && (
                              <div className="flex justify-between items-start">
                                <span className="text-neutral-600 font-medium">Adresse</span>
                                <span className="font-medium text-neutral-800 text-right max-w-40 text-xs">
                                  {getBarAddress()}
                                </span>
                              </div>
                            )}
                            {currentGroup.meeting_time && (
                              <div className="flex justify-between items-center">
                                <span className="text-neutral-600 font-medium flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Rendez-vous
                                </span>
                                <span className="font-semibold text-blue-700 text-xs">
                                  {new Date(currentGroup.meeting_time).toLocaleString('fr-FR')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CORRECTION: Le bouton quitter doit être accessible même pour les groupes confirmés (complets) */}
                      {currentGroup.status !== 'completed' && (
                        <Button
                          onClick={() => leaveGroup(currentGroup.id)}
                          disabled={loading}
                          variant="outline"
                          size="sm"
                          className="w-full mt-4 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 text-xs"
                        >
                          Quitter l'aventure
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Mudra - Déplacée en bas de page */}
                {shouldShowMudra && (
                  <div className="mt-8">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-soft">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                            <Hand className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-heading font-bold text-blue-800 mb-2">
                            🤝 Signe de reconnaissance
                          </h3>
                          <p className="text-sm text-blue-700 mb-4">
                            Pour vous retrouver facilement au bar, utilisez ce mudra discret comme signe de reconnaissance entre membres du groupe.
                          </p>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="flex-shrink-0">
                              <img 
                                src="https://i.postimg.cc/5NQ7rJ1z/Mudra-Naruto-Tigre.png" 
                                alt="Mudra Tigre de Naruto" 
                                className="w-24 h-24 object-contain bg-white rounded-lg shadow-sm border border-blue-200"
                              />
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                              <p className="mb-2">
                                <strong>Le Mudra du Tigre :</strong> Entrelacez vos doigts et pointez vos index vers le haut.
                              </p>
                              <p>
                                Faites ce geste discrètement près de l'entrée ou du bar pour que les autres membres vous repèrent ! 🐅
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
