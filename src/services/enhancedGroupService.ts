import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from './geolocation';
import { GroupGeolocationService } from './groupGeolocation';
import { OptimizedCleanupService } from './optimizedCleanupService';
import { IntelligentCleanupService } from './intelligentCleanupService';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import { toast } from '@/hooks/use-toast';
import type { Group, GroupParticipant } from '@/types/database';
import type { GroupMember } from '@/types/groups';

/**
 * SERVICE DE GROUPES AMÉLIORÉ - Plan anti-groupes zombies
 * 
 * Intègre toutes les améliorations du plan :
 * 1. Définition renforcée d'un groupe "actif"
 * 2. Filtrage par âge lors de la recherche
 * 3. Nettoyage en temps réel
 * 4. Priorité à la création de nouveaux groupes
 */
export class EnhancedGroupService {
  
  /**
   * Initialisation du service avec nettoyage intelligent
   */
  static initialize(): void {
    console.log('🚀 [ENHANCED GROUP SERVICE] Initialisation avec nettoyage intelligent...');
    
    // Démarrer le nettoyage périodique intelligent
    IntelligentCleanupService.startPeriodicIntelligentCleanup();
    
    console.log('✅ [ENHANCED GROUP SERVICE] Service initialisé avec logique intelligente');
  }

  /**
   * Récupération des groupes utilisateur avec filtrage strict
   */
  static async getUserActiveGroups(userId: string): Promise<Group[]> {
    try {
      console.log('📋 [ENHANCED] Récupération groupes actifs pour:', userId);
      
      // Filtrer par participants actifs dans les 2 dernières heures
      const activeThreshold = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_ACTIVITY_THRESHOLD).toISOString();
      
      const { data: participations, error } = await supabase
        .from('group_participants')
        .select(`
          group_id,
          joined_at,
          last_seen,
          groups!inner(
            id,
            created_at,
            status,
            bar_name,
            bar_address,
            meeting_time,
            max_participants,
            current_participants,
            latitude,
            longitude,
            location_name,
            search_radius,
            bar_latitude,
            bar_longitude,
            bar_place_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed'])
        .gt('last_seen', activeThreshold) // NOUVEAU: Seulement participants actifs (2h)
        .order('joined_at', { ascending: false });

      if (error) {
        ErrorHandler.logError('FETCH_USER_ACTIVE_GROUPS', error);
        return [];
      }

      const validGroups = (participations || [])
        .map(p => p.groups)
        .filter(group => {
          if (!group) return false;
          
          // Appliquer le filtrage d'âge des groupes (3 heures max)
          return OptimizedCleanupService.isGroupActive(group);
        }) as Group[];

      console.log(`✅ [ENHANCED] ${validGroups.length} groupes actifs trouvés`);
      return validGroups;
    } catch (error) {
      ErrorHandler.logError('GET_USER_ACTIVE_GROUPS', error);
      return [];
    }
  }

  /**
   * Récupération des membres avec statut de connexion en temps réel
   */
  static async getGroupActiveMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 [ENHANCED] Récupération membres actifs:', groupId);
      
      // Filtrer par participants actifs dans les 2 dernières heures
      const activeThreshold = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_ACTIVITY_THRESHOLD).toISOString();
      
      const { data: participants, error } = await supabase
        .from('group_participants')
        .select('id, user_id, joined_at, status, last_seen')
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .gt('last_seen', activeThreshold) // NOUVEAU: Seulement participants actifs
        .order('joined_at', { ascending: true });

      if (error) {
        ErrorHandler.logError('FETCH_GROUP_ACTIVE_MEMBERS', error);
        return [];
      }

      const members: GroupMember[] = (participants || []).map((participant, index) => {
        const lastSeenDate = new Date(participant.last_seen || participant.joined_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
        
        // Statut connecté si vu dans les 10 dernières minutes
        const isConnected = diffMinutes <= (GROUP_CONSTANTS.CONNECTION_THRESHOLD / (1000 * 60));

        return {
          id: participant.id,
          name: `Rander ${index + 1}`,
          isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: participant.last_seen || participant.joined_at
        };
      });

      console.log(`✅ [ENHANCED] ${members.length} membres actifs trouvés`);
      return members;
    } catch (error) {
      ErrorHandler.logError('GET_GROUP_ACTIVE_MEMBERS', error);
      return [];
    }
  }

  /**
   * Rejoindre un groupe aléatoire avec nouvelle logique de priorité
   */
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
        description: 'Votre position est nécessaire pour rejoindre un groupe dans votre zone.', 
        variant: 'destructive' 
      });
      return false;
    }

    console.log('🎲 [ENHANCED] Démarrage joinRandomGroup avec nouvelle logique...');
    setLoading(true);
    
    try {
      // Vérifier participation existante AVEC seuil d'activité strict (2 heures)
      const activeThreshold = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_ACTIVITY_THRESHOLD).toISOString();

      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(status)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed'])
        .gt('last_seen', activeThreshold); // NOUVEAU: Seuil d'activité strict

      if (checkError) {
        console.error('❌ Erreur de vérification:', checkError);
        throw checkError;
      }

      if (existingParticipation && existingParticipation.length > 0) {
        console.log('⚠️ Utilisateur déjà dans un groupe actif (moins de 2h)');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif !', 
          variant: 'destructive' 
        });
        return false;
      }

      console.log('✅ [ENHANCED] Utilisateur libre, recherche avec nouvelle logique...');

      // Recherche avec filtres anti-zombies
      const targetGroup = await GroupGeolocationService.findCompatibleGroup(userLocation);

      if (!targetGroup) {
        console.log('🆕 [ENHANCED] Création d\'un nouveau groupe (priorité ou aucun groupe viable)...');
        
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

        console.log('✅ [ENHANCED] Nouveau groupe créé:', newGroup.id);
        
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
          description: `Groupe créé dans votre zone (${userLocation.locationName}). Attendez d'autres participants !`, 
        });
        
        return true;
      } else {
        console.log('🔗 [ENHANCED] Rejoindre le groupe compatible:', targetGroup.id);
        
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
          description: `Vous avez rejoint un groupe actif dans votre zone !`, 
        });

        return true;
      }
    } catch (error) {
      console.error('❌ Erreur dans joinRandomGroup enhanced:', error);
      toast({ 
        title: 'Erreur de recherche', 
        description: 'Impossible de trouver ou créer un groupe. Vérifiez votre connexion.', 
        variant: 'destructive' 
      });
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Quitter un groupe avec nettoyage intelligent
   */
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
      console.log('🚪 [ENHANCED] Quitter le groupe:', groupId);

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

      console.log('✅ [ENHANCED] Participation supprimée avec succès');

      // Déclencher un nettoyage immédiat pour ce groupe
      await OptimizedCleanupService.runRealtimeCleanup();

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

  /**
   * Mise à jour de l'activité utilisateur
   */
  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        ErrorHandler.logError('UPDATE_USER_ACTIVITY_ENHANCED', error);
      } else {
        console.log('✅ [ENHANCED] Activité utilisateur mise à jour');
      }
    } catch (error) {
      ErrorHandler.logError('UPDATE_USER_ACTIVITY_ENHANCED', error);
    }
  }
}