
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group, GroupParticipant } from '@/types/database';
import { toast } from '@/components/ui/use-toast';

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserGroups = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: participations, error } = await supabase
        .from('group_participants')
        .select(`
          *,
          groups (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      
      const userGroupsData = participations?.map(p => p.groups).filter(Boolean) || [];
      setUserGroups(userGroupsData as Group[]);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRandomGroup = async () => {
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté pour rejoindre un groupe.', variant: 'destructive' });
      return false;
    }

    setLoading(true);
    try {
      // Vérifier si l'utilisateur est déjà dans un groupe actif
      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed']);

      if (checkError) throw checkError;

      if (existingParticipation && existingParticipation.length > 0) {
        toast({ title: 'Déjà dans un groupe', description: 'Vous êtes déjà dans un groupe actif !', variant: 'destructive' });
        return false;
      }

      // Chercher un groupe en attente
      const { data: waitingGroups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 'max_participants')
        .order('created_at', { ascending: true })
        .limit(1);

      if (groupError) throw groupError;

      let targetGroup: Group;

      if (waitingGroups && waitingGroups.length > 0) {
        // Rejoindre un groupe existant
        targetGroup = waitingGroups[0] as Group;
      } else {
        // Créer un nouveau groupe
        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert({
            status: 'waiting',
            max_participants: 5,
            current_participants: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        targetGroup = newGroup as Group;
      }

      // Ajouter l'utilisateur au groupe
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: targetGroup.id,
          user_id: user.id,
          status: 'confirmed'
        });

      if (joinError) throw joinError;

      // Mettre à jour le nombre de participants
      const newParticipantCount = targetGroup.current_participants + 1;
      const newStatus = newParticipantCount >= 5 ? 'full' : 'waiting';

      const { error: updateError } = await supabase
        .from('groups')
        .update({ 
          current_participants: newParticipantCount,
          status: newStatus,
          ...(newStatus === 'full' && {
            bar_name: 'Le Procope',
            bar_address: '13 Rue de l\'Ancienne Comédie, 75006 Paris',
            meeting_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // Dans 2h
          })
        })
        .eq('id', targetGroup.id);

      if (updateError) throw updateError;

      if (newStatus === 'full') {
        toast({ 
          title: 'Groupe complet !', 
          description: 'Votre groupe de 5 est formé ! Rendez-vous vous a été assigné.',
        });
      } else {
        toast({ 
          title: 'Vous êtes dans la course !', 
          description: `Groupe rejoint ! En attente de ${5 - newParticipantCount} autres participants.`,
        });
      }

      fetchUserGroups();
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      toast({ title: 'Erreur', description: 'Impossible de rejoindre un groupe.', variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      // Supprimer la participation
      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Mettre à jour le nombre de participants
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('current_participants')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      const newParticipantCount = Math.max(0, group.current_participants - 1);
      
      if (newParticipantCount === 0) {
        // Supprimer le groupe s'il n'y a plus personne
        await supabase.from('groups').delete().eq('id', groupId);
      } else {
        // Mettre à jour le groupe
        await supabase
          .from('groups')
          .update({ 
            current_participants: newParticipantCount,
            status: 'waiting'
          })
          .eq('id', groupId);
      }

      toast({ title: 'Groupe quitté', description: 'Vous avez quitté le groupe.' });
      fetchUserGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({ title: 'Erreur', description: 'Impossible de quitter le groupe.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  return {
    groups,
    userGroups,
    loading,
    joinRandomGroup,
    leaveGroup,
    fetchUserGroups
  };
};
