import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ManualScheduledGroupService, ManualScheduledGroup } from '@/services/manualScheduledGroupService';
import ManualScheduleGroupButton from '@/components/ManualScheduleGroupButton';
import AppLayout from '@/components/AppLayout';

const ExploreByCityPage: React.FC = () => {
  const { user } = useAuth();
  const [myScheduledGroups, setMyScheduledGroups] = useState<ManualScheduledGroup[]>([]);
  const [allScheduledGroups, setAllScheduledGroups] = useState<ManualScheduledGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyScheduledGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const groups = await ManualScheduledGroupService.getUserScheduledGroups(user.id);
      setMyScheduledGroups(groups);
    } catch (error) {
      console.error('Error fetching my scheduled groups:', error);
      toast.error('Erreur lors du chargement de vos groupes');
    }
  }, [user]);

  const fetchAllScheduledGroups = useCallback(async () => {
    try {
      const groups = await ManualScheduledGroupService.getAllScheduledGroups();
      setAllScheduledGroups(groups);
    } catch (error) {
      console.error('Error fetching all scheduled groups:', error);
      toast.error('Erreur lors du chargement des groupes');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMyScheduledGroups(), fetchAllScheduledGroups()]);
    setLoading(false);
  }, [fetchMyScheduledGroups, fetchAllScheduledGroups]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour rejoindre un groupe');
      return;
    }

    try {
      const result = await ManualScheduledGroupService.joinScheduledGroup(groupId, user.id);
      
      if (result.success) {
        toast.success('Vous avez rejoint le groupe avec succès !');
        await fetchData();
      } else {
        toast.error(result.error || 'Erreur lors de la participation au groupe');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Une erreur inattendue s\'est produite');
    }
  };

  const handleCancelGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const result = await ManualScheduledGroupService.cancelScheduledGroup(groupId, user.id);
      
      if (result.success) {
        toast.success('Groupe annulé avec succès');
        await fetchData();
      } else {
        toast.error(result.error || 'Erreur lors de l\'annulation du groupe');
      }
    } catch (error) {
      console.error('Error cancelling group:', error);
      toast.error('Une erreur inattendue s\'est produite');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">En attente</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmé</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), "EEEE d MMMM 'à' HH:mm", { locale: fr });
  };

  const renderGroupCard = (group: ManualScheduledGroup, showJoinButton = false) => {
    const isUserCreator = user && group.created_by_user_id === user.id;
    const canJoin = showJoinButton && !isUserCreator && group.current_participants < group.max_participants;

    return (
      <Card key={group.id} className="h-full">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold">
                {group.bar_name_manual}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <MapPinIcon className="w-4 h-4 mr-1" />
                {group.city_name}
              </CardDescription>
            </div>
            {getStatusBadge(group.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPinIcon className="w-4 h-4 mr-2" />
              {group.bar_address_manual}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {group.scheduled_for && formatDateTime(group.scheduled_for)}
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <UsersIcon className="w-4 h-4 mr-2" />
              {group.current_participants}/{group.max_participants} participants
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {canJoin && (
              <Button 
                size="sm" 
                onClick={() => handleJoinGroup(group.id)}
                className="bg-primary hover:bg-primary/90"
              >
                Rejoindre
              </Button>
            )}
            
            {isUserCreator && group.status === 'waiting' && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => handleCancelGroup(group.id)}
              >
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Explorer par ville</h1>
              <Skeleton className="h-10 w-40" />
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-64" />
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Explorer par ville</h1>
            <ManualScheduleGroupButton onScheduled={fetchData} />
          </div>

          <Tabs defaultValue="my-groups" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-groups">Mes groupes programmés</TabsTrigger>
              <TabsTrigger value="join-group">Rejoindre un groupe</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-groups" className="space-y-6">
              {myScheduledGroups.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore programmé de groupe
                  </p>
                  <ManualScheduleGroupButton onScheduled={fetchData} />
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {myScheduledGroups.map((group) => renderGroupCard(group, false))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="join-group" className="space-y-6">
              {allScheduledGroups.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-xl">
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="text-muted-foreground">
                    Aucun groupe programmé disponible pour le moment
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {allScheduledGroups
                    .filter(group => group.created_by_user_id !== user?.id)
                    .map((group) => renderGroupCard(group, true))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default ExploreByCityPage;