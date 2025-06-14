
import { useGroups } from '@/hooks/useGroups';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, ArrowLeft } from 'lucide-react';
import RandomButton from '@/components/RandomButton';
import GroupMembersList from '@/components/GroupMembersList';
import GroupMap from '@/components/GroupMap';
import GroupChat from '@/components/GroupChat';

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

  const isGroupComplete = currentGroup?.status === 'confirmed' && currentGroup?.current_participants >= 5;

  // Debug: Afficher les informations du groupe dans la console
  console.log('🔍 [GroupsPage] Groupe actuel:', currentGroup);
  console.log('🔍 [GroupsPage] Groupe complet?', isGroupComplete);
  console.log('🔍 [GroupsPage] Bar assigné?', {
    name: currentGroup?.bar_name,
    address: currentGroup?.bar_address,
    meetingTime: currentGroup?.meeting_time,
    coordinates: currentGroup?.bar_latitude && currentGroup?.bar_longitude ? 
      `${currentGroup.bar_latitude}, ${currentGroup.bar_longitude}` : 'Non défini'
  });

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-white via-brand-50/30 to-brand-100/20">
        <div className="px-4 md:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neutral-600 hover:text-neutral-800"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-3xl font-display font-bold text-neutral-800">
                    Mon Groupe
                  </h1>
                  <p className="text-neutral-600 font-body">
                    Suivez l'évolution de votre aventure en temps réel
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="bg-white/50 backdrop-blur-sm border-brand-300 text-brand-700 hover:bg-brand-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* État de chargement */}
            {loading && userGroups.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-display font-bold text-neutral-800 mb-2">
                  Chargement de votre groupe...
                </h3>
                <p className="text-neutral-600 font-body">Cela ne prendra qu'un instant</p>
              </div>
            )}

            {/* Pas de groupe actif */}
            {!currentGroup && !loading && (
              <div className="text-center py-20">
                <div className="w-32 h-32 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Users className="h-16 w-16 text-brand-600" />
                </div>
                <h3 className="text-3xl font-display font-bold text-neutral-800 mb-4">
                  Aucun groupe actif
                </h3>
                <p className="text-xl text-neutral-600 font-body mb-8 max-w-2xl mx-auto">
                  Vous n'avez pas encore rejoint de groupe. Créez votre première aventure !
                </p>
                <RandomButton size="lg" />
              </div>
            )}

            {/* Affichage du groupe actif */}
            {currentGroup && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  {/* Afficher la carte même si toutes les données ne sont pas présentes */}
                  {isGroupComplete && (
                    <GroupMap
                      barName={currentGroup.bar_name || "Bar en cours d'attribution..."}
                      barAddress={currentGroup.bar_address || "Adresse en cours de recherche..."}
                      meetingTime={currentGroup.meeting_time || new Date(Date.now() + 60 * 60 * 1000).toISOString()}
                      isGroupComplete={isGroupComplete}
                      barLatitude={currentGroup.bar_latitude}
                      barLongitude={currentGroup.bar_longitude}
                    />
                  )}

                  {/* Informations du groupe */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-white/50">
                    <h3 className="text-xl font-display font-bold text-neutral-800 mb-4">
                      Informations du groupe
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Statut :</span>
                        <span className={`font-medium ${
                          currentGroup.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {currentGroup.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Participants :</span>
                        <span className="font-medium text-neutral-800">
                          {currentGroup.current_participants}/{currentGroup.max_participants}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Créé le :</span>
                        <span className="font-medium text-neutral-800">
                          {new Date(currentGroup.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {currentGroup.location_name && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Zone :</span>
                          <span className="font-medium text-neutral-800">
                            {currentGroup.location_name}
                          </span>
                        </div>
                      )}
                      {/* Debug info - Afficher les informations du bar */}
                      {currentGroup.bar_name && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Bar :</span>
                            <span className="font-medium text-green-700">
                              {currentGroup.bar_name}
                            </span>
                          </div>
                          {currentGroup.bar_address && (
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Adresse :</span>
                              <span className="font-medium text-neutral-800 text-right max-w-48 truncate">
                                {currentGroup.bar_address}
                              </span>
                            </div>
                          )}
                          {currentGroup.meeting_time && (
                            <div className="flex justify-between">
                              <span className="text-neutral-600">RDV :</span>
                              <span className="font-medium text-blue-700">
                                {new Date(currentGroup.meeting_time).toLocaleString('fr-FR')}
                              </span>
                            </div>
                          )}
                          {currentGroup.bar_latitude && currentGroup.bar_longitude && (
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Coordonnées :</span>
                              <span className="font-medium text-neutral-800 text-xs">
                                {currentGroup.bar_latitude.toFixed(4)}, {currentGroup.bar_longitude.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {currentGroup.status !== 'completed' && (
                      <Button
                        onClick={() => leaveGroup(currentGroup.id)}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="w-full mt-6 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                      >
                        Quitter le groupe
                      </Button>
                    )}
                  </div>
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
