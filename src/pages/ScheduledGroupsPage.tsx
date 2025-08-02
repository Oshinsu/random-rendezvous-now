import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduledGroupService, ScheduledGroup } from '@/services/scheduledGroupService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, X, UserPlus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { ScheduleGroupButton } from '@/components/ScheduleGroupButton';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import FullGroupDisplay from '@/components/FullGroupDisplay';
import { useOptimizedDataFetching } from '@/hooks/useOptimizedDataFetching';
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

export default function ScheduledGroupsPage() {
  const { user } = useAuth();
  const { debouncedFetch } = useOptimizedDataFetching();
  const [myScheduledGroups, setMyScheduledGroups] = useState<ScheduledGroup[]>([]);
  const [allScheduledGroups, setAllScheduledGroups] = useState<ScheduledGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<{
    type: 'joining' | 'cancelling' | 'deleting';
    id: string;
  } | null>(null);

  const fetchMyScheduledGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const groups = await ScheduledGroupService.getUserScheduledGroups(user.id);
      setMyScheduledGroups(groups);
    } catch (error) {
      // Silent error handling - no console spam
    }
  }, [user]);

  const fetchAllScheduledGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_scheduled', true)
        .eq('status', 'waiting')
        .neq('created_by_user_id', user.id)
        .lt('current_participants', 5)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (!error) {
        setAllScheduledGroups((groups || []) as ScheduledGroup[]);
      }
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
      const { error } = await supabase
        .from('group_participants')
        .insert({
          group_id: groupId,
          user_id: user.id,
          status: 'confirmed',
          last_seen: new Date().toISOString()
        });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de rejoindre le groupe",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Vous avez rejoint le groupe"
      });
      
      await fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
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
      const result = await ScheduledGroupService.cancelScheduledGroup(groupId, user.id);
      
      if (result.success) {
        toast({
          title: "Annulé",
          description: "Groupe annulé"
        });
        await fetchData();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'annuler",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
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
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('created_by_user_id', user.id)
        .in('status', ['waiting', 'cancelled']);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Supprimé",
        description: "Groupe supprimé"
      });
      
      await fetchData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive"
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">En attente</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmé</Badge>;
      case 'full':
        return <Badge variant="default">Complet</Badge>;
      case 'completed':
        return <Badge variant="outline">Terminé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'PPP à HH:mm', { locale: fr });
  };

  const renderGroupCard = (group: ScheduledGroup, showJoinButton = false) => {
    // Si le groupe est confirmé avec un bar assigné, afficher l'expérience complète
    if (group.status === 'confirmed' && group.bar_name && !showJoinButton) {
      return (
        <div key={group.id} className="space-y-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-emerald-800">
                      🎉 {group.bar_name}
                    </CardTitle>
                    {getStatusBadge(group.status)}
                  </div>
                  {group.scheduled_for && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <Clock className="h-4 w-4" />
                      Planifié pour {formatDateTime(group.scheduled_for)}
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-700 text-sm mb-4">
                Votre groupe est complet et votre destination est confirmée ! Profitez de l'expérience complète ci-dessous.
              </p>
            </CardContent>
          </Card>
          
          {/* Affichage complet du groupe avec carte, chat, etc. */}
          <FullGroupDisplay
            group={group}
            showChat={true}
            showMudra={true}
          />
        </div>
      );
    }

    // Affichage standard pour les autres groupes
    return (
      <Card key={group.id}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {group.bar_name || 'Groupe en attente de bar'}
                </CardTitle>
                {getStatusBadge(group.status)}
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
                  {actionInProgress?.type === 'joining' && actionInProgress?.id === group.id ? 'Joining...' : 'Rejoindre'}
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
                          <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer définitivement ce groupe ? 
                            Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteGroup(group.id)}
                            disabled={actionInProgress?.type === 'deleting' && actionInProgress?.id === group.id}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {actionInProgress?.type === 'deleting' && actionInProgress?.id === group.id ? 'Suppression...' : 'Supprimer'}
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
              <span>{group.current_participants}/{group.max_participants} participants</span>
            </div>
            {group.location_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{group.location_name}</span>
              </div>
            )}
          </div>
          
          {group.meeting_time && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Heure de rendez-vous confirmée :</p>
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
            <h1 className="text-3xl font-bold mb-8">Groupes planifiés</h1>
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold">Groupes planifiés</h1>
            <ScheduleGroupButton onScheduled={fetchData} />
          </div>

          <Tabs defaultValue="my-groups" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-100 p-1 rounded-xl">
              <TabsTrigger 
                value="my-groups" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-500 data-[state=active]:to-brand-600 data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-200"
              >
                Mes groupes ({myScheduledGroups.length})
              </TabsTrigger>
              <TabsTrigger 
                value="all-groups"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-500 data-[state=active]:to-brand-600 data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-200"
              >
                Rejoindre un groupe ({allScheduledGroups.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-groups" className="space-y-4 mt-6">
              {myScheduledGroups.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Aucun groupe planifié</h2>
                    <p className="text-muted-foreground mb-6">
                      Planifiez votre prochain groupe pour une sortie future !
                    </p>
                    <ScheduleGroupButton onScheduled={fetchData} />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myScheduledGroups.map((group) => renderGroupCard(group, false))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all-groups" className="space-y-4 mt-6">
              {allScheduledGroups.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Aucun groupe disponible</h2>
                    <p className="text-muted-foreground">
                      Il n'y a actuellement aucun groupe planifié que vous pouvez rejoindre.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {allScheduledGroups.map((group) => renderGroupCard(group, true))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}