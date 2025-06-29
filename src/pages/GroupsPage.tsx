
import { useEffect } from 'react';
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups';
import { UnifiedCleanupService } from '@/services/unifiedCleanupService';
import AppLayout from '@/components/AppLayout';
import GroupMembersList from '@/components/GroupMembersList';
import GroupMap from '@/components/GroupMap';
import GroupChat from '@/components/GroupChat';
import BarAssignmentButton from '@/components/BarAssignmentButton';
import GroupHeader from '@/components/groups/GroupHeader';
import NoActiveGroupMessage from '@/components/groups/NoActiveGroupMessage';
import GroupDetails from '@/components/groups/GroupDetails';
import GroupMudra from '@/components/groups/GroupMudra';
import LoadingState from '@/components/groups/LoadingState';

const GroupsPage = () => {
  const { userGroups, groupMembers, loading, refetchGroups, leaveGroup, userLocation } = useUnifiedGroups();

  // Déclenchement du système unifié au montage
  useEffect(() => {
    console.log('🔄 [GROUPS PAGE UNIFIÉ] Déclenchement récupération avec système unifié');
    
    // Déclenchement du nettoyage unifié si nécessaire
    if (userGroups.length === 0) {
      console.log('🧹 [GROUPS PAGE UNIFIÉ] Pas de groupes trouvés - nettoyage préventif');
      UnifiedCleanupService.forceEmergencyCleanup();
    }
    
    // Force un refetch immédiat pour la récupération
    refetchGroups();
  }, []);

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const handleRefresh = () => {
    console.log('🔄 Refresh manuel avec système unifié (page Groups)');
    refetchGroups();
  };

  const handleBack = () => {
    window.history.back();
  };

  const currentGroup = activeGroups[0];

  const isGroupComplete = currentGroup?.current_participants >= 5;
  const needsBarAssignment = isGroupComplete && currentGroup?.status === 'confirmed' && !currentGroup?.bar_name;
  const canShowMap = isGroupComplete;
  const shouldShowMudra = isGroupComplete && currentGroup?.bar_name;

  const getBarAddress = () => {
    if (currentGroup?.bar_address) {
      return currentGroup.bar_address;
    }
    if (currentGroup?.bar_latitude && currentGroup?.bar_longitude) {
      return `Coordonnées: ${currentGroup.bar_latitude.toFixed(4)}, ${currentGroup.bar_longitude.toFixed(4)}`;
    }
    return "Recherche de bar en cours...";
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-white via-brand-50/30 to-brand-100/20">
        <div className="px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            
            {loading && userGroups.length === 0 && <LoadingState />}

            {!loading && !currentGroup && (
              <NoActiveGroupMessage onBack={handleBack} />
            )}

            {!loading && currentGroup && (
              <>
                <GroupHeader 
                  onBack={handleBack}
                  onRefresh={handleRefresh}
                  loading={loading}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <GroupMembersList
                      members={groupMembers}
                      maxParticipants={currentGroup.max_participants}
                      currentParticipants={currentGroup.current_participants}
                    />
                    
                    <GroupChat
                      groupId={currentGroup.id}
                      isGroupComplete={isGroupComplete}
                      barName={currentGroup.bar_name}
                    />
                  </div>

                  <div className="space-y-6">
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

                    <GroupDetails
                      group={currentGroup}
                      onLeaveGroup={() => leaveGroup(currentGroup.id)}
                      loading={loading}
                    />
                  </div>
                </div>

                {shouldShowMudra && <GroupMudra />}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupsPage;
