import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedScheduledGroupService, UnifiedScheduledGroup } from '@/services/unifiedScheduledGroupService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, X, UserPlus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import InlineScheduleGroupForm from '@/components/InlineScheduleGroupForm';
import AppLayout from '@/components/AppLayout';
import FullGroupDisplay from '@/components/FullGroupDisplay';
import { useOptimizedDataFetching } from '@/hooks/useOptimizedDataFetching';
import { useTranslation } from 'react-i18next';

// Lazy load modal to avoid circular import issues at boot
const PushPermissionModal = lazy(() => import('@/components/PushPermissionModal').then(m => ({ default: m.PushPermissionModal })));
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function UnifiedScheduledGroupsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { debouncedFetch } = useOptimizedDataFetching();
  const [myScheduledGroups, setMyScheduledGroups] = useState<UnifiedScheduledGroup[]>([]);
  const [allScheduledGroups, setAllScheduledGroups] = useState<UnifiedScheduledGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<{
    type: 'joining' | 'cancelling' | 'deleting';
    id: string;
  } | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [groupCreated, setGroupCreated] = useState(false);

  // Show push permission modal when group is confirmed
  useEffect(() => {
    const confirmedGroup = myScheduledGroups.find(g => g.status === 'confirmed');
    if (confirmedGroup) {
      const hasSeenModal = localStorage.getItem('push_permission_modal_shown');
      if (!hasSeenModal) {
        setShowPermissionModal(true);
      }
    }
  }, [myScheduledGroups]);

  const fetchMyScheduledGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const groups = await UnifiedScheduledGroupService.getUserScheduledGroups(user.id);
      setMyScheduledGroups(groups);
    } catch (error) {
      // Silent error handling - no console spam
    }
  }, [user]);

  const fetchAllScheduledGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const groups = await UnifiedScheduledGroupService.getAllAvailableScheduledGroups(user.id);
      setAllScheduledGroups(groups);
    } catch (error) {
      // Silent error handling - no console spam
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    return debouncedFetch(async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchMyScheduledGroups(), fetchAllScheduledGroups()]);
      } finally {
        setIsLoading(false);
      }
    }, 2000); // Debounce for 2 seconds
  }, [debouncedFetch, fetchMyScheduledGroups, fetchAllScheduledGroups]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleJoinGroup = async (groupId: string) => {
    if (!user || actionInProgress) return;

    setActionInProgress({ type: 'joining', id: groupId });
    try {
      const result = await UnifiedScheduledGroupService.joinScheduledGroup(groupId, user.id);

      if (result.success) {
        toast({
          title: t('scheduled_groups.success_join'),
          description: t('scheduled_groups.success_join')
        });
        await fetchData();
      } else {
        toast({
          title: t('common.error'),
          description: result.error || t('scheduled_groups.error_join'),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('scheduled_groups.error_occurred'),
        variant: "destructive"
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelGroup = async (groupId: string) => {
    if (!user || actionInProgress) return;

    setActionInProgress({ type: 'cancelling', id: groupId });
    try {
      const result = await UnifiedScheduledGroupService.cancelScheduledGroup(groupId, user.id);
      
      if (result.success) {
        toast({
          title: t('scheduled_groups.success_cancel'),
          description: t('scheduled_groups.success_cancel')
        });
        await fetchData();
      } else {
        toast({
          title: t('common.error'),
          description: result.error || t('scheduled_groups.error_cancel'),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('scheduled_groups.error_occurred'),
        variant: "destructive"
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user || actionInProgress) return;

    setActionInProgress({ type: 'deleting', id: groupId });
    try {
      const result = await UnifiedScheduledGroupService.deleteScheduledGroup(groupId, user.id);

      if (result.success) {
        toast({
          title: t('scheduled_groups.success_delete'),
          description: t('scheduled_groups.success_delete')
        });
        await fetchData();
      } else {
        toast({
          title: t('common.error'),
          description: result.error || t('scheduled_groups.error_delete'),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('scheduled_groups.error_occurred'),
        variant: "destructive"
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">{t('scheduled_groups.status.waiting')}</Badge>;
      case 'confirmed':
        return <Badge variant="default">{t('scheduled_groups.status.confirmed')}</Badge>;
      case 'full':
        return <Badge variant="default">{t('scheduled_groups.status.full')}</Badge>;
      case 'completed':
        return <Badge variant="outline">{t('scheduled_groups.status.completed')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('scheduled_groups.status.cancelled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'PPP à HH:mm', { locale: fr });
  };

  const getGroupDisplayName = (group: UnifiedScheduledGroup) => {
    // Manual mode - show manual bar name
    if (group.bar_name_manual) {
      return group.bar_name_manual;
    }
    // Automatic mode - show assigned bar name or default
    return group.bar_name || t('scheduled_groups.waiting_bar', { defaultValue: 'Groupe en attente de bar' });
  };

  const getGroupLocation = (group: UnifiedScheduledGroup) => {
    // Manual mode - show city and address
    if (group.city_name && group.bar_address_manual) {
      return `${group.city_name} - ${group.bar_address_manual}`;
    }
    // Automatic mode - show location name or coordinates
    return group.location_name || `${group.latitude?.toFixed(4)}, ${group.longitude?.toFixed(4)}`;
  };

  const renderGroupCard = (group: UnifiedScheduledGroup, showJoinButton = false) => {
    // If the group is confirmed with a bar assigned, show full experience
    if (group.status === 'confirmed' && group.bar_name && !showJoinButton) {
      return (
        <div key={group.id} className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-emerald-800">
                      🎉 {getGroupDisplayName(group)}
                    </CardTitle>
                    {getStatusBadge(group.status)}
                  </div>
                  {group.scheduled_for && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <Clock className="h-4 w-4" />
                      {t('scheduled_groups.scheduled_for')} {formatDateTime(group.scheduled_for)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {group.status === 'confirmed' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionInProgress?.type === 'cancelling' && actionInProgress?.id === group.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('scheduled_groups.confirm_cancel_title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('scheduled_groups.confirm_cancel_desc')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('scheduled_groups.keep')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelGroup(group.id)}
                            disabled={actionInProgress?.type === 'cancelling' && actionInProgress?.id === group.id}
                          >
                            {actionInProgress?.type === 'cancelling' && actionInProgress?.id === group.id ? t('scheduled_groups.cancelling') : t('scheduled_groups.cancel')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700 text-sm mb-4">
                {t('scheduled_groups.group_complete')}
              </p>
            </CardContent>
          </Card>
          
          {/* Full group display with chat, map, etc. */}
          <FullGroupDisplay
            group={group}
            showChat={true}
            showMudra={true}
          />
        </div>
      );
    }

    // Standard display for other groups
    return (
      <Card key={group.id}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {getGroupDisplayName(group)}
                </CardTitle>
                {getStatusBadge(group.status)}
                {group.city_name && (
                  <Badge variant="outline" className="ml-2">
                    {group.city_name}
                  </Badge>
                )}
              </div>
              {group.scheduled_for && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(group.scheduled_for)}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {showJoinButton && (
                <Button
                  onClick={() => handleJoinGroup(group.id)}
                  disabled={actionInProgress?.type === 'joining' && actionInProgress?.id === group.id}
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-medium"
                >
                  <UserPlus className="h-4 w-4" />
                  {actionInProgress?.type === 'joining' && actionInProgress?.id === group.id ? t('scheduled_groups.joining') : t('scheduled_groups.join')}
                </Button>
              )}
              {!showJoinButton && (
                <div className="flex gap-2">
                  {group.status !== 'completed' && group.status !== 'cancelled' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionInProgress?.type === 'cancelling' && actionInProgress?.id === group.id}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Annuler le groupe</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir annuler ce groupe planifié ? 
                            Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Garder</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelGroup(group.id)}
                            disabled={actionInProgress?.type === 'cancelling' && actionInProgress?.id === group.id}
                          >
                            {actionInProgress?.type === 'cancelling' && actionInProgress?.id === group.id ? 'Annulation...' : 'Annuler'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {(group.status === 'waiting' || group.status === 'cancelled') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionInProgress?.type === 'deleting' && actionInProgress?.id === group.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('scheduled_groups.confirm_delete_title')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('scheduled_groups.confirm_delete_desc')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGroup(group.id)}
                            disabled={actionInProgress?.type === 'deleting' && actionInProgress?.id === group.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {actionInProgress?.type === 'deleting' && actionInProgress?.id === group.id ? t('scheduled_groups.deleting') : t('scheduled_groups.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{group.current_participants}/{group.max_participants} {t('scheduled_groups.participants')}</span>
            </div>
            {getGroupLocation(group) && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{getGroupLocation(group)}</span>
              </div>
            )}
          </div>
          
          {group.meeting_time && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{t('scheduled_groups.confirmed_meeting')}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(group.meeting_time)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">{t('scheduled_groups.title')}</h1>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* PHASE 5: Contextualized Permission Request */}
      {showPermissionModal && (
        <Suspense fallback={null}>
          <PushPermissionModal 
            trigger="first_group" 
            onClose={() => setShowPermissionModal(false)}
          />
        </Suspense>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
            <div className="space-y-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-xl font-heading font-bold gradient-text">{t('scheduled_groups.title')}</h1>
              </div>
              <InlineScheduleGroupForm 
                onScheduled={() => {
                  fetchData();
                  // Trigger permission modal after first group creation
                  const hasCreatedBefore = localStorage.getItem('has_created_group');
                  if (!hasCreatedBefore) {
                    localStorage.setItem('has_created_group', 'true');
                    setShowPermissionModal(true);
                  }
                }} 
              />
            </div>

          <Tabs defaultValue="my-groups" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-100 p-1 rounded-xl">
              <TabsTrigger 
                value="my-groups" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"
              >
                {t('scheduled_groups.my_groups')} ({myScheduledGroups.length})
              </TabsTrigger>
              <TabsTrigger 
                value="join-groups"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-semibold"
              >
                {t('scheduled_groups.available_groups')} ({allScheduledGroups.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-groups" className="mt-6">
              <div className="space-y-6">
                {myScheduledGroups.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('scheduled_groups.no_groups')}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t('scheduled_groups.no_groups_desc')}
                      </p>
                      <InlineScheduleGroupForm onScheduled={fetchData} />
                    </CardContent>
                  </Card>
                ) : (
                  myScheduledGroups.map(group => renderGroupCard(group, false))
                )}
              </div>
            </TabsContent>

            <TabsContent value="join-groups" className="mt-6">
              <div className="space-y-6">
                {allScheduledGroups.length === 0 ? (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">{t('scheduled_groups.no_available')}</h3>
                      <p className="text-muted-foreground">
                        {t('scheduled_groups.no_available_desc')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  allScheduledGroups.map(group => renderGroupCard(group, true))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}