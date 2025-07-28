
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database';
import { LocationData } from '@/services/geolocation';
import { GroupGeolocationService } from './groupGeolocation';
import { GroupService } from './groupService';
import { toast } from '@/hooks/use-toast';

export class GroupOperationsService {
  // CORRIGÉ: Nettoyage périodique RÉALISTE pour usage normal
  static async forceCleanupOldGroups(): Promise<void> {
    try {
      console.log('🧹 [CLEANUP PÉRIODIQUE] Nettoyage RÉALISTE...');

      // 1. Supprimer les participants inactifs depuis 6 HEURES (au lieu de 24 heures ou 5 minutes)
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

      console.log('🗑️ Suppression des participants inactifs depuis 6h...');

      const { data: oldParticipants, error: selectError } = await supabase
        .from('group_participants')
        .select('group_id, last_seen')
        .lt('last_seen', sixHoursAgo);

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
            .lt('last_seen', sixHoursAgo);

          const currentCount = await GroupService.getCurrentParticipantCount(groupId);
          
          if (currentCount === 0) {
            await supabase
              .from('groups')
              .delete()
              .eq('id', groupId);
            console.log('🗑️ [CLEANUP] Groupe vide supprimé:', groupId);
          } else {
            await GroupService.updateGroupParticipantCount(groupId, currentCount);
          }
        }
      }

      // 2. Supprimer les groupes en attente vides anciens (12 heures au lieu de 48 heures)
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .eq('current_participants', 0)
        .lt('created_at', twelveHoursAgo);

      console.log('✅ [CLEANUP PÉRIODIQUE] Nettoyage RÉALISTE terminé');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage périodique:', error);
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
      console.log('📋 [JOIN] Vérification RÉALISTE des participations existantes...');

      // Vérification avec seuil de 3 heures au lieu de 24 heures
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(status)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed'])
        .gt('last_seen', threeHoursAgo); // Seuil RÉALISTE de 3 heures

      if (checkError) {
        console.error('❌ Erreur de vérification:', checkError);
        throw checkError;
      }

      if (existingParticipation && existingParticipation.length > 0) {
        console.log('⚠️ Utilisateur déjà dans un groupe actif (moins de 3h)');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif !', 
          variant: 'destructive' 
        });
        return false;
      }

      console.log('✅ [JOIN] Utilisateur libre, recherche d\'un groupe...');

      console.log('🌍 Recherche dans un rayon de 10km...');
      const targetGroup = await GroupGeolocationService.findCompatibleGroup(userLocation);

      if (!targetGroup) {
        console.log('🆕 Création d\'un nouveau groupe géolocalisé...');
        const newGroupData: any = {
          status: 'waiting',
          max_participants: 5,
          current_participants: 0,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          location_name: userLocation.locationName,
          search_radius: 10000
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
        
        // Track group creation
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'group_create',
            group_id: newGroup.id,
            location_name: userLocation.locationName,
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            max_participants: 5
          });
        }
        
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

        // Track group join for new group
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'group_join',
            group_id: newGroup.id,
            location_name: userLocation.locationName,
            is_creator: true
          });
        }

        toast({ 
          title: '🎉 Nouveau groupe créé', 
          description: `Groupe créé dans votre zone (${userLocation.locationName}). Vous pouvez fermer l'app !`, 
        });
        
        console.log('✅ [GEOLOC_OBLIGATOIRE] Utilisateur ajouté au nouveau groupe géolocalisé');
        return true;
      } else {
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

        // Track group join for existing group
        if (typeof window !== 'undefined' && window.dataLayer) {
          window.dataLayer.push({
            event: 'group_join',
            group_id: targetGroup.id,
            location_name: userLocation.locationName,
            is_creator: false
          });
        }

        toast({ 
          title: '✅ Groupe rejoint', 
          description: `Vous avez rejoint un groupe dans votre zone (${userLocation.locationName}). Vous pouvez fermer l'app !`, 
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
      console.log('🚪 [LEAVE] Quitter le groupe:', groupId, 'utilisateur:', user.id);

      console.log('🧹 Nettoyage immédiat de l\'état local');
      clearUserGroupsState();

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

      console.log('✅ [LEAVE] Participation supprimée avec succès');

      const realCount = await GroupService.getCurrentParticipantCount(groupId);
      console.log('📊 [LEAVE] Participants restants après départ:', realCount);

      if (realCount === 0) {
        console.log('🗑️ [LEAVE] Suppression du groupe vide');
        await supabase
          .from('groups')
          .delete()
          .eq('id', groupId);
      } else {
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
          console.log('⏳ [LEAVE] Remise en waiting et suppression du bar');
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
