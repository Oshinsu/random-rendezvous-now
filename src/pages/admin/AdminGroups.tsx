import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/admin/AdminTable";
import { GroupComposition } from "@/components/admin/GroupComposition";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Users, Clock, CheckCircle, Calendar } from "lucide-react";
import { Group, GroupParticipant } from '@/types/database';

interface GroupWithParticipants extends Group {
  participants?: any[];
  created_by_user_id?: string; // Add the missing field
}

export const AdminGroups = () => {
  const [groups, setGroups] = useState<GroupWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'confirmed' | 'completed'>('all');
  const { toast } = useToast();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      // Step 1: Fetch groups with participants (without profiles)
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          participants:group_participants(*)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Step 2: Get all unique user IDs from participants
      const allUserIds = new Set<string>();
      groupsData?.forEach(group => {
        group.participants?.forEach(participant => {
          if (participant.user_id) {
            allUserIds.add(participant.user_id);
          }
        });
      });

      // Step 4: Fetch all profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', Array.from(allUserIds));

      if (profilesError) throw profilesError;

      // Step 5: Create a map for quick profile lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Step 6: Merge profiles with participants
      const enrichedGroups = groupsData?.map(group => ({
        ...group,
        participants: group.participants?.map(participant => ({
          ...participant,
          profiles: profilesMap.get(participant.user_id) || null
        }))
      }));

      setGroups(enrichedGroups as GroupWithParticipants[] || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleForceConfirm = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: 'confirmed' })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Groupe confirmé",
        description: "Le groupe a été forcé en statut confirmé",
      });

      fetchGroups();
    } catch (error) {
      console.error('Error confirming group:', error);
      toast({
        title: "Erreur",
        description: "Impossible de confirmer le groupe",
        variant: "destructive",
      });
    }
  };

  const handleCancelGroup = async (groupId: string) => {
    console.log('🚀 [DEBUG] Attempting to cancel group:', groupId);
    
    try {
      // Debug: Check current user session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('🚀 [DEBUG] Current session:', { 
        user_id: sessionData?.session?.user?.id, 
        email: sessionData?.session?.user?.email,
        sessionError 
      });

      // Debug: Check admin status
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin_user');
      console.log('🚀 [DEBUG] Admin check result:', { isAdmin, adminError });

      const { error } = await supabase
        .from('groups')
        .update({ status: 'cancelled' })
        .eq('id', groupId);

      console.log('🚀 [DEBUG] Update result:', { error });

      if (error) throw error;

      toast({
        title: "Groupe annulé",
        description: "Le groupe a été annulé avec succès.",
      });
      
      fetchGroups();
    } catch (error) {
      console.error('🚨 [ERROR] Error cancelling group:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'annuler le groupe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      waiting: { variant: 'outline' as const, color: 'text-yellow-600 border-yellow-300', icon: Clock },
      confirmed: { variant: 'outline' as const, color: 'text-green-600 border-green-300', icon: CheckCircle },
      completed: { variant: 'outline' as const, color: 'text-blue-600 border-blue-300', icon: MapPin },
      cancelled: { variant: 'outline' as const, color: 'text-red-600 border-red-300', icon: Clock }
    };
    
    const config = variants[status as keyof typeof variants] || variants.waiting;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const filteredGroups = groups.filter(group => 
    filter === 'all' || group.status === filter
  );

  const columns = [
    {
      header: "Statut",
      accessor: "status" as keyof GroupWithParticipants,
      render: (value: string) => getStatusBadge(value)
    },
    {
      header: "Participants",
      accessor: "current_participants" as keyof GroupWithParticipants,
      render: (value: number, row: GroupWithParticipants) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {value}/{row.max_participants}
        </div>
      )
    },
    {
      header: "Composition",
      accessor: "participants" as keyof GroupWithParticipants,
      render: (participants: any[], row: GroupWithParticipants) => (
        <GroupComposition
          participants={participants || []}
          createdByUserId={row.created_by_user_id}
          createdAt={row.created_at}
        />
      )
    },
    {
      header: "Zone",
      accessor: "location_name" as keyof GroupWithParticipants,
      render: (value: string) => (
        <div className="max-w-[200px] truncate" title={value}>
          {value || "Non spécifiée"}
        </div>
      )
    },
    {
      header: "Bar assigné",
      accessor: "bar_name" as keyof GroupWithParticipants,
      render: (value: string) => (
        <div className="max-w-[150px] truncate" title={value}>
          {value || "Aucun"}
        </div>
      )
    },
    {
      header: "Créé le",
      accessor: "created_at" as keyof GroupWithParticipants,
      render: (value: string) => new Date(value).toLocaleString('fr-FR')
    },
    {
      header: "Actions",
      accessor: "id" as keyof GroupWithParticipants,
      render: (value: string, row: GroupWithParticipants) => (
        <div className="flex gap-2">
          {row.status === 'waiting' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleForceConfirm(value)}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              Confirmer
            </Button>
          )}
          {['waiting', 'confirmed'].includes(row.status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCancelGroup(value)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Annuler
            </Button>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-800">Gestion des groupes</h1>
          <p className="text-red-600 mt-2">Supervision et modération des groupes en temps réel</p>
        </div>
        <Button onClick={fetchGroups} variant="outline" size="sm">
          Actualiser
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-700">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {groups.filter(g => g.status === 'waiting').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700">Confirmés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">
              {groups.filter(g => g.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Terminés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {groups.filter(g => g.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700">Total actif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">
              {groups.filter(g => ['waiting', 'confirmed'].includes(g.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {(['all', 'waiting', 'confirmed', 'completed'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'Tous' : 
             status === 'waiting' ? 'En attente' :
             status === 'confirmed' ? 'Confirmés' : 
             'Terminés'}
          </Button>
        ))}
      </div>

      {/* Table des groupes */}
      <AdminTable
        data={filteredGroups}
        columns={columns}
        searchKey="location_name"
        searchPlaceholder="Rechercher par zone..."
      />
    </div>
  );
};