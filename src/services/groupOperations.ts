
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database';
import { LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from './groupGeolocation';
import { GroupMembersService } from './groupMembers';
import { toast } from '@/hooks/use-toast';

export class GroupOperationsService {
  static async joinRandomGroup(
    user: any,
    userLocation: LocationData | null,
    loading: boolean,
    setLoading: (loading: boolean) => void
  ): Promise<boolean> {
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

    console.log('🎲 [LAST_SEEN] Démarrage joinRandomGroup pour:', user.id);
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

      let targetGroup: Group | null = null;

      // 1. Essayer de trouver un groupe compatible géographiquement
      if (userLocation) {
        targetGroup = await GroupGeolocationService.findCompatibleGroup(userLocation);
      }

      // 2. Si pas de groupe géolocalisé compatible, chercher un groupe classique
      if (!targetGroup) {
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

        if (waitingGroups && waitingGroups.length > 0) {
          targetGroup = waitingGroups[0] as Group;
          console.log('🔗 Rejoindre le groupe existant:', targetGroup.id);
        }
      }

      // 3. Si toujours aucun groupe, créer un nouveau groupe
      if (!targetGroup) {
        console.log('🆕 Création d\'un nouveau groupe...');
        const newGroupData: any = {
          status: 'waiting',
          max_participants: 5,
          current_participants: 0
        };

        // Ajouter la géolocalisation si disponible avec rayon de 10km par défaut
        if (userLocation) {
          newGroupData.latitude = userLocation.latitude;
          newGroupData.longitude = userLocation.longitude;
          newGroupData.location_name = userLocation.locationName;
          newGroupData.search_radius = 10000; // 10km par défaut
          console.log('📍 Nouveau groupe avec géolocalisation:', {
            location: userLocation.locationName,
            coordinates: `${userLocation.latitude}, ${userLocation.longitude}`,
            radius: '10km'
          });
        }

        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert(newGroupData)
          .select()
          .single();

        if (createError) {
          console.error('❌ Erreur de création de groupe:', createError);
          throw createError;
        }

        targetGroup = newGroup as Group;
        console.log('✅ Nouveau groupe créé:', targetGroup.id);
      }

      // Ajouter l'utilisateur au groupe avec last_seen initialisé
      const participantData: any = {
        group_id: targetGroup.id,
        user_id: user.id,
        status: 'confirmed',
        last_seen: new Date().toISOString() // Initialiser last_seen
      };

      // Ajouter la géolocalisation du participant si disponible
      if (userLocation) {
        participantData.latitude = userLocation.latitude;
        participantData.longitude = userLocation.longitude;
        participantData.location_name = userLocation.locationName;
      }

      const { error: joinError } = await supabase
        .from('group_participants')
        .insert(participantData);

      if (joinError) {
        console.error('❌ Erreur d\'ajout au groupe:', joinError);
        throw joinError;
      }

      console.log('✅ [LAST_SEEN] Utilisateur ajouté au groupe avec last_seen initialisé');
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
  }

  static async leaveGroup(
    groupId: string,
    user: any,
    loading: boolean,
    setLoading: (loading: boolean) => void,
    clearUserGroupsState: () => void
  ): Promise<void> {
    if (!user || loading) {
      console.log('🚫 Impossible de quitter - pas d\'utilisateur ou chargement en cours');
      return;
    }

    setLoading(true);
    try {
      console.log('🚪 [LAST_SEEN] Quitter le groupe:', groupId, 'utilisateur:', user.id);

      // ÉTAPE 1: Nettoyer immédiatement l'état local pour un feedback visuel instantané
      console.log('🧹 Nettoyage immédiat de l\'état local');
      clearUserGroupsState();

      // ÉTAPE 2: Supprimer la participation avec vérification explicite de l'utilisateur
      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (deleteError) {
        console.error('❌ Erreur pour supprimer la participation:', deleteError);
        throw deleteError;
      }

      console.log('✅ [LAST_SEEN] Participation supprimée avec succès');

      // ÉTAPE 3: FORCER la correction du comptage immédiatement
      const realCount = await GroupMembersService.getCurrentParticipantCount(groupId);
      console.log('📊 [LAST_SEEN] Participants restants après départ:', realCount);

      if (realCount === 0) {
        // Supprimer le groupe s'il est vide
        console.log('🗑️ [LAST_SEEN] Suppression du groupe vide');
        await supabase
          .from('groups')
          .delete()
          .eq('id', groupId);
      } else {
        // Mettre à jour le comptage et remettre en waiting si nécessaire
        let updateData: any = {
          current_participants: realCount
        };

        if (realCount < 5) {
          updateData = {
            ...updateData,
            status: 'waiting',
            bar_name: null,
            bar_address: null,
            meeting_time: null,
            bar_latitude: null,
            bar_longitude: null,
            bar_place_id: null
          };
          console.log('⏳ [LAST_SEEN] Remise en waiting et suppression du bar');
        }

        await supabase
          .from('groups')
          .update(updateData)
          .eq('id', groupId);
      }

      toast({ 
        title: '✅ Groupe quitté', 
        description: 'Vous avez quitté le groupe avec succès.' 
      });
      
    } catch (error) {
      console.error('❌ Erreur pour quitter le groupe:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de quitter le groupe. Veuillez réessayer.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }
}
