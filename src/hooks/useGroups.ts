
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group, GroupParticipant } from '@/types/database';
import { toast } from '@/hooks/use-toast';

// Liste des bars parisiens pour la sélection aléatoire
const PARIS_BARS = [
  { name: "Le Procope", address: "13 Rue de l'Ancienne Comédie, 75006 Paris" },
  { name: "Harry's Bar", address: "5 Rue Daunou, 75002 Paris" },
  { name: "Le Mary Celeste", address: "1 Rue Commines, 75003 Paris" },
  { name: "Candelaria", address: "52 Rue de Saintonge, 75003 Paris" },
  { name: "Little Red Door", address: "60 Rue Charlot, 75003 Paris" },
  { name: "Le Syndicat", address: "51 Rue du Faubourg Saint-Antoine, 75011 Paris" },
  { name: "Hemingway Bar", address: "15 Place Vendôme, 75001 Paris" },
  { name: "Le Bar du Plaza", address: "25 Avenue Montaigne, 75008 Paris" },
  { name: "Moonshiner", address: "5 Rue Sedaine, 75011 Paris" },
  { name: "Glass", address: "7 Rue Frochot, 75009 Paris" }
];

const getRandomBar = () => {
  const randomIndex = Math.floor(Math.random() * PARIS_BARS.length);
  return PARIS_BARS[randomIndex];
};

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserGroups = useCallback(async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      console.log('DEBUG: Fetching user groups for user:', user.id);
      
      const { data: participations, error: participationError } = await supabase
        .from('group_participants')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (participationError) {
        console.error('DEBUG: Error fetching participations:', participationError);
        throw participationError;
      }

      console.log('DEBUG: User participations found:', participations);

      if (!participations || participations.length === 0) {
        console.log('DEBUG: No participations found, setting empty array');
        setUserGroups([]);
        return;
      }

      const groupIds = participations.map(p => p.group_id);
      console.log('DEBUG: Fetching groups with IDs:', groupIds);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) {
        console.error('DEBUG: Error fetching groups:', groupsError);
        throw groupsError;
      }

      console.log('DEBUG: Groups data retrieved:', groupsData);
      setUserGroups((groupsData || []) as Group[]);
    } catch (error) {
      console.error('DEBUG: Error in fetchUserGroups:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de récupérer vos groupes.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const joinRandomGroup = async () => {
    if (!user) {
      console.error('DEBUG: No user found for joinRandomGroup');
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    console.log('DEBUG: Starting joinRandomGroup for user:', user.id);
    setLoading(true);
    
    try {
      console.log('DEBUG: Checking existing participations...');
      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (checkError) {
        console.error('DEBUG: Error checking existing participation:', checkError);
        throw checkError;
      }

      console.log('DEBUG: Existing participations check result:', existingParticipation);

      if (existingParticipation && existingParticipation.length > 0) {
        const groupIds = existingParticipation.map(p => p.group_id);
        console.log('DEBUG: Checking if groups are still active:', groupIds);
        
        const { data: activeGroups, error: activeGroupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .in('status', ['waiting', 'confirmed']);

        if (activeGroupsError) {
          console.error('DEBUG: Error checking active groups:', activeGroupsError);
          throw activeGroupsError;
        }

        console.log('DEBUG: Active groups found:', activeGroups);

        if (activeGroups && activeGroups.length > 0) {
          console.log('DEBUG: User already in active group, aborting');
          toast({ 
            title: 'Déjà dans un groupe', 
            description: 'Vous êtes déjà dans un groupe actif !', 
            variant: 'destructive' 
          });
          return false;
        }
      }

      // FIX: Corriger la requête SQL problématique
      console.log('DEBUG: Looking for available waiting groups...');
      const { data: waitingGroups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 5) // FIX: Utiliser la valeur directement au lieu de comparer à une colonne
        .order('created_at', { ascending: true })
        .limit(1);

      if (groupError) {
        console.error('DEBUG: Error fetching waiting groups:', groupError);
        throw groupError;
      }

      console.log('DEBUG: Available waiting groups found:', waitingGroups);

      let targetGroup: Group;

      if (waitingGroups && waitingGroups.length > 0) {
        targetGroup = waitingGroups[0] as Group;
        console.log('DEBUG: Joining existing group:', targetGroup.id);
      } else {
        console.log('DEBUG: Creating new group...');
        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert({
            status: 'waiting',
            max_participants: 5,
            current_participants: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('DEBUG: Error creating group:', createError);
          throw createError;
        }

        targetGroup = newGroup as Group;
        console.log('DEBUG: New group created:', targetGroup.id);
      }

      console.log('DEBUG: Adding user to group...');
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: targetGroup.id,
          user_id: user.id,
          status: 'confirmed'
        });

      if (joinError) {
        console.error('DEBUG: Error joining group:', joinError);
        throw joinError;
      }

      console.log('DEBUG: User successfully added to group');

      const newParticipantCount = targetGroup.current_participants + 1;
      const newStatus = newParticipantCount >= 5 ? 'confirmed' : 'waiting';
      console.log('DEBUG: Updating group with new participant count:', newParticipantCount, 'new status:', newStatus);

      let updateData: any = { 
        current_participants: newParticipantCount,
        status: newStatus
      };

      if (newStatus === 'confirmed') {
        const randomBar = getRandomBar();
        const meetingTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        updateData = {
          ...updateData,
          bar_name: randomBar.name,
          bar_address: randomBar.address,
          meeting_time: meetingTime.toISOString()
        };
        console.log('DEBUG: Group is full, adding bar info:', randomBar);
      }

      const { error: updateError } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', targetGroup.id);

      if (updateError) {
        console.error('DEBUG: Error updating group:', updateError);
        throw updateError;
      }

      console.log('DEBUG: Group updated successfully');

      if (newStatus === 'confirmed') {
        toast({ 
          title: 'Groupe complet !', 
          description: `Votre groupe de 5 est formé ! Rendez-vous au ${updateData.bar_name} dans 2h.`,
        });
      } else {
        toast({ 
          title: 'Vous êtes dans la course !', 
          description: `Groupe rejoint ! En attente de ${5 - newParticipantCount} autres participants.`,
        });
      }

      console.log('DEBUG: Refreshing user groups...');
      await fetchUserGroups();
      return true;
    } catch (error) {
      console.error('DEBUG: Error in joinRandomGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de rejoindre un groupe. Veuillez réessayer.', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      console.log('Leaving group:', groupId);

      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error leaving group:', deleteError);
        throw deleteError;
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, status')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        throw groupError;
      }

      const newParticipantCount = Math.max(0, group.current_participants - 1);
      
      if (newParticipantCount === 0) {
        await supabase.from('groups').delete().eq('id', groupId);
        console.log('Empty group deleted');
      } else {
        const newStatus = newParticipantCount < 5 ? 'waiting' : group.status;
        await supabase
          .from('groups')
          .update({ 
            current_participants: newParticipantCount,
            status: newStatus,
            ...(newStatus === 'waiting' && {
              bar_name: null,
              bar_address: null,
              meeting_time: null
            })
          })
          .eq('id', groupId);
        console.log('Group updated after leave');
      }

      toast({ title: 'Groupe quitté', description: 'Vous avez quitté le groupe avec succès.' });
      await fetchUserGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de quitter le groupe.', 
        variant: 'destructive' 
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user, fetchUserGroups]);

  return {
    groups,
    userGroups,
    loading,
    joinRandomGroup,
    leaveGroup,
    fetchUserGroups
  };
};
