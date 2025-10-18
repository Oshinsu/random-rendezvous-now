
import { useEffect, lazy, Suspense } from 'react';
import { useUnifiedGroups } from '@/hooks/useUnifiedGroups';
import { toast } from '@/hooks/use-toast';

// Nettoyage géré automatiquement par cleanup-groups edge function
import AppLayout from '@/components/AppLayout';
import GroupMembersList from '@/components/GroupMembersList';
// GroupMap is heavy (Google Maps). Lazy-load it for performance.
// import GroupMap from '@/components/GroupMap';
import GroupChat from '@/components/GroupChat';
import BarAssignmentButton from '@/components/BarAssignmentButton';
import GroupHeader from '@/components/groups/GroupHeader';
import NoActiveGroupMessage from '@/components/groups/NoActiveGroupMessage';
import GroupDetails from '@/components/groups/GroupDetails';
import GroupMudra from '@/components/groups/GroupMudra';
import LoadingState from '@/components/groups/LoadingState';
import { BarSearchLoadingCard } from '@/components/groups/BarSearchLoadingCard';
import { useAnalytics } from '@/hooks/useAnalytics';

// Lazy-load heavy map component to improve initial load
const LazyGroupMap = lazy(() => import('@/components/GroupMap'));

const GroupsPage = () => {
  const { 
    userGroups, 
    groupMembers, 
    loading, 
    refetchGroups, 
    leaveGroup, 
    userLocation
  } = useUnifiedGroups();
  
  // No tracking for page views - only core business events

  // Déclenchement du système unifié au montage
  useEffect(() => {
    // Fetching groups data
    // Le nettoyage est géré automatiquement par cleanup-groups edge function
    // Realtime va charger les données automatiquement, pas besoin de refetch manuel
  }, []);

  // 🎯 Écouter les events de bar assignment et refetch automatiquement
  useEffect(() => {
    const handleBarAssigned = (event: CustomEvent) => {
      console.log('🍺 Bar assigné détecté dans GroupsPage');
      
      // ✅ Toast notification
      toast({
        title: "🎉 Bar assigné !",
        description: `Rendez-vous au ${event.detail.barName}`,
        duration: 5000,
      });
      
      refetchGroups();
    };

    window.addEventListener('group:bar-assigned', handleBarAssigned as EventListener);
    
    return () => {
      window.removeEventListener('group:bar-assigned', handleBarAssigned as EventListener);
    };
  }, [refetchGroups]);

  const activeGroups = userGroups.filter(group => 
    group.status === 'waiting' || group.status === 'confirmed'
  );

  const handleRefresh = () => {
    // Manual refresh
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
        <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
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

                  <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                    {needsBarAssignment && <BarSearchLoadingCard />}

                    {canShowMap && (
                      <Suspense
                        fallback={
                          <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 text-center">
                            Chargement de la carte…
                          </div>
                        }
                      >
                        <LazyGroupMap
                          barName={currentGroup.bar_name || "Destination en cours de sélection"}
                          barAddress={getBarAddress()}
                          meetingTime={currentGroup.meeting_time || new Date(Date.now() + 60 * 60 * 1000).toISOString()}
                          isGroupComplete={isGroupComplete}
                          barLatitude={currentGroup.bar_latitude}
                          barLongitude={currentGroup.bar_longitude}
                        />
                      </Suspense>
                    )}

                    <GroupDetails
                      group={currentGroup}
                      onLeaveGroup={() => {
                        leaveGroup(currentGroup.id);
                      }}
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
