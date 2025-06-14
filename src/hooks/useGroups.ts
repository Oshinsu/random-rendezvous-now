
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  const fetchUserGroups = useCallback(async () => {
    if (!user || fetchingRef.current) {
      console.log('🚫 Fetch bloqué - utilisateur:', !!user, 'en cours:', fetchingRef.current);
      return;
    }
    
    // Éviter les appels trop fréquents
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      console.log('🚫 Fetch trop fréquent, ignoré');
      return;
    }
    
    fetchingRef.current = true;
    lastFetchRef.current = now;
    setLoading(true);
    
    try {
      console.log('🔄 Récupération des groupes pour:', user.id);
      
      const { data: participations, error: participationError } = await supabase
        .from('group_participants')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (participationError) {
        console.error('❌ Erreur participations:', participationError);
        throw participationError;
      }

      console.log('✅ Participations trouvées:', participations?.length || 0);

      if (!participations || participations.length === 0) {
        setUserGroups([]);
        return;
      }

      const groupIds = participations.map(p => p.group_id);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('❌ Erreur groupes:', groupsError);
        throw groupsError;
      }

      console.log('✅ Groupes récupérés:', groupsData?.length || 0);
      setUserGroups((groupsData || []) as Group[]);
    } catch (error) {
      console.error('❌ Erreur fetchUserGroups:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de récupérer vos groupes.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  const joinRandomGroup = async () => {
    if (!user) {
      toast({ 
        title: 'Erreur', 
        description: 'Vous devez être connecté pour rejoindre un groupe.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (loading) {
      console.log('⏳ Opération déjà en cours...');
      return false;
    }

    console.log('🎲 Démarrage joinRandomGroup pour:', user.id);
    setLoading(true);
    
    try {
      // Vérifier les participations existantes
      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(status)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (checkError) {
        console.error('❌ Erreur de vérification:', checkError);
        throw checkError;
      }

      if (existingParticipation && existingParticipation.length > 0) {
        console.log('⚠️ Utilisateur déjà dans un groupe actif');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif !', 
          variant: 'destructive' 
        });
        return false;
      }

      // Chercher un groupe en attente avec de la place
      const { data: waitingGroups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 5)
        .order('created_at', { ascending: true })
        .limit(1);

      if (groupError) {
        console.error('❌ Erreur de recherche de groupes:', groupError);
        throw groupError;
      }

      let targetGroup: Group;

      if (waitingGroups && waitingGroups.length > 0) {
        targetGroup = waitingGroups[0] as Group;
        console.log('🔗 Rejoindre le groupe existant:', targetGroup.id);
      } else {
        console.log('🆕 Création d\'un nouveau groupe...');
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
          console.error('❌ Erreur de création de groupe:', createError);
          throw createError;
        }

        targetGroup = newGroup as Group;
        console.log('✅ Nouveau groupe créé:', targetGroup.id);
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
        console.error('❌ Erreur d\'ajout au groupe:', joinError);
        throw joinError;
      }

      console.log('✅ Utilisateur ajouté au groupe avec succès');

      // Mettre à jour le nombre de participants
      const newParticipantCount = targetGroup.current_participants + 1;
      
      if (newParticipantCount >= 5) {
        const randomBar = getRandomBar();
        const meetingTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        await supabase
          .from('groups')
          .update({
            current_participants: newParticipantCount,
            status: 'confirmed',
            bar_name: randomBar.name,
            bar_address: randomBar.address,
            meeting_time: meetingTime.toISOString()
          })
          .eq('id', targetGroup.id);

        toast({ 
          title: '🎉 Groupe complet !', 
          description: `Votre groupe de 5 est formé ! Rendez-vous au ${randomBar.name} dans 2h.`,
        });
      } else {
        await supabase
          .from('groups')
          .update({ current_participants: newParticipantCount })
          .eq('id', targetGroup.id);

        toast({ 
          title: '🚀 Vous êtes dans la course !', 
          description: `Groupe rejoint ! En attente de ${5 - newParticipantCount} autre${5 - newParticipantCount > 1 ? 's' : ''} participant${5 - newParticipantCount > 1 ? 's' : ''}.`,
        });
      }

      // Attendre un peu avant de rafraîchir pour éviter les conflits
      setTimeout(() => {
        fetchUserGroups();
      }, 500);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur dans joinRandomGroup:', error);
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
    if (!user || loading) return;

    setLoading(true);
    try {
      console.log('🚪 Quitter le groupe:', groupId);

      // Supprimer la participation
      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Erreur pour quitter le groupe:', deleteError);
        throw deleteError;
      }

      // Récupérer le groupe pour mettre à jour le count
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('current_participants')
        .eq('id', groupId)
        .single();

      if (!groupError && group) {
        const newCount = Math.max(0, group.current_participants - 1);
        
        if (newCount === 0) {
          // Supprimer le groupe s'il est vide
          await supabase
            .from('groups')
            .delete()
            .eq('id', groupId);
        } else {
          // Mettre à jour le count et le statut si nécessaire
          const updateData: any = { current_participants: newCount };
          if (newCount < 5) {
            updateData.status = 'waiting';
            updateData.bar_name = null;
            updateData.bar_address = null;
            updateData.meeting_time = null;
          }
          
          await supabase
            .from('groups')
            .update(updateData)
            .eq('id', groupId);
        }
      }

      toast({ 
        title: '✅ Groupe quitté', 
        description: 'Vous avez quitté le groupe avec succès.' 
      });
      
      // Attendre un peu avant de rafraîchir
      setTimeout(() => {
        fetchUserGroups();
      }, 500);
    } catch (error) {
      console.error('❌ Erreur pour quitter le groupe:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de quitter le groupe.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect pour charger les groupes au montage et quand l'utilisateur change
  useEffect(() => {
    if (user) {
      console.log('🔄 Utilisateur détecté, chargement des groupes...');
      fetchUserGroups();
    } else {
      console.log('🚫 Pas d\'utilisateur, reset des groupes');
      setUserGroups([]);
    }
  }, [user?.id]); // Utiliser user.id plutôt que user pour éviter les re-renders

  return {
    groups,
    userGroups,
    loading,
    joinRandomGroup,
    leaveGroup,
    fetchUserGroups
  };
};
