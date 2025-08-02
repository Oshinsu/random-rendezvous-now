import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduledGroupService, ScheduledGroup } from '@/services/scheduledGroupService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, X, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { ScheduleGroupButton } from '@/components/ScheduleGroupButton';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
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
  const [myScheduledGroups, setMyScheduledGroups] = useState<ScheduledGroup[]>([]);
  const [allScheduledGroups, setAllScheduledGroups] = useState<ScheduledGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchMyScheduledGroups = async () => {
    if (!user) return;
    
    try {
      const groups = await ScheduledGroupService.getUserScheduledGroups(user.id);
      setMyScheduledGroups(groups);
    } catch (error) {
      console.error('Error fetching my scheduled groups:', error);
    }
  };

  const fetchAllScheduledGroups = async () => {
    if (!user) return;
    
    try {
      // Fetch all scheduled groups that are not full and not created by current user
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_scheduled', true)
        .eq('status', 'waiting')
        .neq('created_by_user_id', user.id)
        .lt('current_participants', 5)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching all scheduled groups:', error);
        return;
      }

      setAllScheduledGroups((groups || []) as ScheduledGroup[]);
    } catch (error) {
      console.error('Error fetching all scheduled groups:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchMyScheduledGroups(), fetchAllScheduledGroups()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    setJoiningId(groupId);
    try {
      // Add user as participant
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
        title: "Groupe rejoint !",
        description: "Vous avez rejoint le groupe planifié"
      });
      
      await fetchData(); // Refresh both lists
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setJoiningId(null);
    }
  };

  const handleCancelGroup = async (groupId: string) => {
    if (!user) return;

    setCancellingId(groupId);
    try {
      const result = await ScheduledGroupService.cancelScheduledGroup(groupId, user.id);
      
      if (result.success) {
        toast({
          title: "Groupe annulé",
          description: "Votre groupe planifié a été annulé"
        });
        await fetchData();
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible d'annuler le groupe",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error cancelling group:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setCancellingId(null);
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

  const renderGroupCard = (group: ScheduledGroup, showJoinButton = false) => (
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
                disabled={joiningId === group.id}
                size="sm"
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {joiningId === group.id ? 'Rejoindre...' : 'Rejoindre'}
              </Button>
            )}
            {!showJoinButton && group.status !== 'completed' && group.status !== 'cancelled' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cancellingId === group.id}
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
                      disabled={cancellingId === group.id}
                    >
                      {cancellingId === group.id ? 'Annulation...' : 'Annuler le groupe'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-groups">Mes groupes ({myScheduledGroups.length})</TabsTrigger>
              <TabsTrigger value="all-groups">Rejoindre un groupe ({allScheduledGroups.length})</TabsTrigger>
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