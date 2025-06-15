
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database';
import { LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from './groupGeolocation';
import { toast } from '@/hooks/use-toast';

export class GroupOperationsService {
  static async updateGroupParticipantCount(groupId: string, count: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ current_participants: count })
        .eq('id', groupId);
      
      if (error) {
        console.error('❌ Erreur mise à jour comptage participants:', error);
        throw error;
      }
      
      console.log('✅ Comptage participants mis à jour:', count);
    } catch (error) {
      console.error('❌ Erreur updateGroupParticipantCount:', error);
      throw error;
    }
  }

  static async getCurrentParticipantCount(groupId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');

      if (error) {
        console.error('❌ Erreur comptage participants:', error);
        throw error;
      }

      return data ? data.length : 0;
    } catch (error) {
      console.error('❌ Erreur getCurrentParticipantCount:', error);
      throw error;
    }
  }

  static async forceCleanupOldGroups(): Promise<void> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 6);

      console.log('🧹 [CLEANUP] Suppression des groupes inactifs depuis:', cutoffTime.toISOString());

      const { data: oldParticipants, error: selectError } = await supabase
        .from('group_participants')
        .select('group_id, last_seen')
        .lt('last_seen', cutoffTime.toISOString());

      if (selectError) {
        console.error('❌ Erreur lors de la sélection des participants inactifs:', selectError);
        return;
      }

      if (oldParticipants && oldParticipants.length > 0) {
        const groupIdsToClean = [...new Set(oldParticipants.map(p => p.group_id))];
        
        for (const groupId of groupIdsToClean) {
          await supabase
            .from('group_participants')
            .delete()
            .eq('group_id', groupId)
            .lt('last_seen', cutoffTime.toISOString());

          const currentCount = await GroupOperationsService.getCurrentParticipantCount(groupId);
          
          if (currentCount === 0) {
            await supabase
              .from('groups')
              .delete()
              .eq('id', groupId);
            console.log('🗑️ [CLEANUP] Groupe vide supprimé:', groupId);
          } else {
            await GroupOperationsService.updateGroupParticipantCount(groupId, currentCount);
          }
        }
      }

      console.log('✅ [CLEANUP] Nettoyage terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage forcé:', error);
    }
  }

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

    // GÉOLOCALISATION OBLIGATOIRE
    if (!userLocation) {
      toast({ 
        title: 'Géolocalisation requise', 
        description: 'Votre position est nécessaire pour rejoindre un groupe dans votre zone (10km).', 
        variant: 'destructive' 
      });
      return false;
    }

    console.log('🎲 [GEOLOC_OBLIGATOIRE] Démarrage joinRandomGroup pour:', user.id);
    setLoading(true);
    
    try {
      // ÉTAPE 0: FORCER le nettoyage des vieux groupes AVANT de vérifier les participations
      console.log('🧹 [JOIN] Nettoyage forcé des groupes anciens avant recherche...');
      await GroupOperationsService.forceCleanupOldGroups();

      // Vérifier les participations existantes APRÈS le nettoyage
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
        console.log('⚠️ Utilisateur encore dans un groupe actif après nettoyage');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif !', 
          variant: 'destructive' 
        });
        return false;
      }

      console.log('✅ [JOIN] Utilisateur libre après nettoyage, recherche d\'un groupe...');

      // RECHERCHE STRICTEMENT GÉOGRAPHIQUE - PAS DE FALLBACK
      console.log('🌍 Recherche exclusive dans un rayon de 10km...');
      const targetGroup = await GroupGeolocationService.findCompatibleGroup(userLocation);

      if (!targetGroup) {
        // PLUS DE FALLBACK - Création d'un nouveau groupe géolocalisé
        console.log('🆕 Création d\'un nouveau groupe géolocalisé...');
        const newGroupData: any = {
          status: 'waiting',
          max_participants: 5,
          current_participants: 0,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          location_name: userLocation.locationName,
          search_radius: 10000 // 10km strict
        };

        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert(newGroupData)
          .select()
          .single();

        if (createError) {
          console.error('❌ Erreur de création de groupe:', createError);
          throw createError;
        }

        console.log('✅ Nouveau groupe géolocalisé créé (rayon 10km):', newGroup.id);
        
        // Ajouter l'utilisateur au nouveau groupe
        const participantData: any = {
          group_id: newGroup.id,
          user_id: user.id,
          status: 'confirmed',
          last_seen: new Date().toISOString(),
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          location_name: userLocation.locationName
        };

        const { error: joinError } = await supabase
          .from('group_participants')
          .insert(participantData);

        if (joinError) {
          console.error('❌ Erreur d\'ajout au groupe:', joinError);
          throw joinError;
        }

        toast({ 
          title: '🎉 Nouveau groupe créé', 
          description: `Groupe créé dans votre zone (${userLocation.locationName}). En attente d'autres participants.`, 
        });
        
        console.log('✅ [GEOLOC_OBLIGATOIRE] Utilisateur ajouté au nouveau groupe géolocalisé');
        return true;
      } else {
        // Rejoindre le groupe trouvé
        console.log('🔗 Rejoindre le groupe géolocalisé existant:', targetGroup.id);
        
        const participantData: any = {
          group_id: targetGroup.id,
          user_id: user.id,
          status: 'confirmed',
          last_seen: new Date().toISOString(),
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          location_name: userLocation.locationName
        };

        const { error: joinError } = await supabase
          .from('group_participants')
          .insert(participantData);

        if (joinError) {
          console.error('❌ Erreur d\'ajout au groupe:', joinError);
          throw joinError;
        }

        toast({ 
          title: '✅ Groupe rejoint', 
          description: `Vous avez rejoint un groupe dans votre zone (${userLocation.locationName}).`, 
        });

        console.log('✅ [GEOLOC_OBLIGATOIRE] Utilisateur ajouté au groupe géolocalisé existant');
        return true;
      }
    } catch (error) {
      console.error('❌ Erreur dans joinRandomGroup:', error);
      toast({ 
        title: 'Erreur de recherche', 
        description: 'Impossible de trouver ou créer un groupe dans votre zone (10km). Vérifiez votre connexion.', 
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
      const realCount = await GroupOperationsService.getCurrentParticipantCount(groupId);
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
