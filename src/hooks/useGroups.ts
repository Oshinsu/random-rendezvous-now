
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Group, GroupParticipant } from '@/types/database';
import { toast } from '@/components/ui/use-toast';

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

  const fetchUserGroups = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Fetching user groups for user:', user.id);
      
      // Récupérer les participations de l'utilisateur
      const { data: participations, error: participationError } = await supabase
        .from('group_participants')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (participationError) {
        console.error('Error fetching participations:', participationError);
        throw participationError;
      }

      console.log('User participations:', participations);

      if (!participations || participations.length === 0) {
        setUserGroups([]);
        setLoading(false);
        return;
      }

      // Récupérer les détails des groupes
      const groupIds = participations.map(p => p.group_id);
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }

      console.log('User groups data:', groupsData);
      // Type cast the data to match our Group interface
      setUserGroups((groupsData || []) as Group[]);
    } catch (error) {
      console.error('Error fetching user groups:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de récupérer vos groupes.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const joinRandomGroup = async () => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Starting joinRandomGroup for user:', user.id);

      // Vérifier si l'utilisateur est déjà dans un groupe actif
      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (checkError) {
        console.error('Error checking existing participation:', checkError);
        throw checkError;
      }

      console.log('Existing participations:', existingParticipation);

      if (existingParticipation && existingParticipation.length > 0) {
        // Vérifier si ces groupes sont encore actifs
        const groupIds = existingParticipation.map(p => p.group_id);
        const { data: activeGroups, error: activeGroupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds)
          .in('status', ['waiting', 'full', 'confirmed']);

        if (activeGroupsError) {
          console.error('Error checking active groups:', activeGroupsError);
          throw activeGroupsError;
        }

        if (activeGroups && activeGroups.length > 0) {
          toast({ 
            title: 'Déjà dans un groupe', 
            description: 'Vous êtes déjà dans un groupe actif !', 
            variant: 'destructive' 
          });
          return false;
        }
      }

      // Chercher un groupe en attente avec de la place
      const { data: waitingGroups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 'max_participants')
        .order('created_at', { ascending: true })
        .limit(1);

      if (groupError) {
        console.error('Error fetching waiting groups:', groupError);
        throw groupError;
      }

      console.log('Available waiting groups:', waitingGroups);

      let targetGroup: Group;

      if (waitingGroups && waitingGroups.length > 0) {
        // Rejoindre un groupe existant
        targetGroup = waitingGroups[0] as Group;
        console.log('Joining existing group:', targetGroup.id);
      } else {
        // Créer un nouveau groupe
        console.log('Creating new group');
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
          console.error('Error creating group:', createError);
          throw createError;
        }

        targetGroup = newGroup as Group;
        console.log('Created new group:', targetGroup.id);
      }

      // Ajouter l'utilisateur au groupe
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: targetGroup.id,
          user_id: user.id,
          status: 'confirmed'
        });

      if (joinError) {
        console.error('Error joining group:', joinError);
        throw joinError;
      }

      console.log('Successfully joined group');

      // Mettre à jour le nombre de participants
      const newParticipantCount = targetGroup.current_participants + 1;
      const newStatus = newParticipantCount >= 5 ? 'confirmed' : 'waiting';

      let updateData: any = { 
        current_participants: newParticipantCount,
        status: newStatus
      };

      // Si le groupe est complet, assigner un bar et une heure
      if (newStatus === 'confirmed') {
        const randomBar = getRandomBar();
        const meetingTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // Dans 2h
        
        updateData = {
          ...updateData,
          bar_name: randomBar.name,
          bar_address: randomBar.address,
          meeting_time: meetingTime.toISOString()
        };
      }

      const { error: updateError } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', targetGroup.id);

      if (updateError) {
        console.error('Error updating group:', updateError);
        throw updateError;
      }

      console.log('Group updated successfully');

      // Messages de succès
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

      await fetchUserGroups();
      return true;
    } catch (error) {
      console.error('Error in joinRandomGroup:', error);
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

      // Supprimer la participation
      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error leaving group:', deleteError);
        throw deleteError;
      }

      // Récupérer le groupe pour mettre à jour le compteur
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
        // Supprimer le groupe s'il n'y a plus personne
        await supabase.from('groups').delete().eq('id', groupId);
        console.log('Empty group deleted');
      } else {
        // Mettre à jour le groupe (remettre en waiting si nécessaire)
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
