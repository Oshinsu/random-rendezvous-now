
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from '@/services/geolocation';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export const useSimpleGroupManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Récupération des groupes avec nettoyage RÉALISTE
  const { 
    data: userGroups = [], 
    isLoading: groupsLoading,
    refetch: refetchGroups 
  } = useQuery({
    queryKey: ['simpleUserGroups', user?.id],
    queryFn: async (): Promise<Group[]> => {
      if (!user) return [];
      
      console.log('🔍 Récupération RÉALISTE des groupes utilisateur pour:', user.id);
      
      try {
        // Nettoyage automatique avec seuil de 3 heures (au lieu de 5 minutes)
        console.log('🧹 Nettoyage des participants inactifs (>3h)');
        
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        
        // Supprimer les participants inactifs depuis 3 heures
        await supabase
          .from('group_participants')
          .delete()
          .lt('last_seen', threeHoursAgo);

        // Récupérer les participations ACTIVES uniquement (moins de 3h d'inactivité)
        const { data: participations, error: participationsError } = await supabase
          .from('group_participants')
          .select(`
            group_id,
            groups!inner(*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .in('groups.status', ['waiting', 'confirmed'])
          .gte('last_seen', threeHoursAgo); // Seulement les participants actifs (moins de 3h)

        if (participationsError) {
          console.error('❌ Erreur récupération participations:', participationsError);
          throw participationsError;
        }

        if (!participations || participations.length === 0) {
          console.log('ℹ️ Aucune participation active trouvée');
          setGroupMembers([]);
          return [];
        }

        // Extraire les groupes ET mettre à jour les compteurs
        const groups: Group[] = [];
        for (const participation of participations) {
          const group = participation.groups as Group;
          
          // Recalculer le nombre RÉEL de participants pour ce groupe
          const { data: activeParticipants } = await supabase
            .from('group_participants')
            .select('id')
            .eq('group_id', group.id)
            .eq('status', 'confirmed')
            .gte('last_seen', threeHoursAgo);

          const realCount = activeParticipants?.length || 0;
          
          // Corriger le compteur si nécessaire
          if (group.current_participants !== realCount) {
            console.log('🔧 Correction compteur groupe:', group.id, 'de', group.current_participants, 'à', realCount);
            
            await supabase
              .from('groups')
              .update({ current_participants: realCount })
              .eq('id', group.id);
            
            // Mettre à jour l'objet local
            group.current_participants = realCount;
          }
          
          groups.push(group);
        }

        console.log('✅ Groupes récupérés:', groups.length);
        
        // Récupérer les membres du premier groupe actif
        if (groups.length > 0) {
          const firstGroup = groups[0];
          const { data: membersData } = await supabase
            .from('group_participants')
            .select('*')
            .eq('group_id', firstGroup.id)
            .eq('status', 'confirmed')
            .gte('last_seen', threeHoursAgo)
            .order('joined_at', { ascending: true });

          if (membersData) {
            const members: GroupMember[] = membersData.map((participant, index) => ({
              id: participant.id,
              name: `Rander ${index + 1}`,
              isConnected: true, // Tous sont connectés par définition (filtrés par last_seen)
              joinedAt: participant.joined_at,
              status: 'confirmed' as const,
              lastSeen: participant.last_seen || participant.joined_at
            }));
            
            setGroupMembers(members);
            console.log('✅ Membres récupérés:', members.length);
          }
        }

        return groups;
      } catch (error) {
        console.error('❌ Erreur récupération groupes:', error);
        setGroupMembers([]);
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh toutes les 60 secondes (au lieu de 10)
    staleTime: 30000,
  });

  // Récupération de la géolocalisation
  useEffect(() => {
    if (user && !userLocation) {
      GeolocationService.getCurrentLocation()
        .then(setUserLocation)
        .catch(() => console.log('Géolocalisation non disponible'));
    }
  }, [user, userLocation]);

  const leaveGroup = async (groupId: string): Promise<void> => {
    if (!user || loading) return;

    setLoading(true);
    try {
      console.log('🚪 Quitter le groupe:', groupId);
      
      // Nettoyer l'état local immédiatement
      setGroupMembers([]);
      
      // Supprimer la participation
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Erreur quitter groupe:', error);
        throw error;
      }

      toast({
        title: '✅ Groupe quitté',
        description: 'Vous avez quitté le groupe avec succès.'
      });

      // Rafraîchir la liste
      await refetchGroups();
    } catch (error) {
      console.error('❌ Erreur leaveGroup:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de quitter le groupe.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    userGroups,
    groupMembers,
    loading: loading || groupsLoading,
    userLocation,
    leaveGroup,
    refetchGroups
  };
};
