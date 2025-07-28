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
 * SERVICE DE GROUPES AMÉLIORÉ AVEC HEARTBEAT INTELLIGENT
 * 
 * Intègre toutes les améliorations du plan :
 * 1. Définition renforcée d'un groupe "actif"
 * 2. Filtrage par âge lors de la recherche
 * 3. Nettoyage en temps réel
 * 4. Priorité à la création de nouveaux groupes
 * 5. Gestion intelligente du heartbeat et des états de connexion
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

  // ============= FONCTIONNALITÉS INTELLIGENT HEARTBEAT INTÉGRÉES =============

  /**
   * Mise à jour d'activité avec état intelligent (anciennement IntelligentHeartbeatService.updateUserActivity)
   */
  static async updateUserActivity(groupId: string, userId: string, isActive: boolean = true): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Mise à jour du last_seen
      const { error } = await supabase
        .from('group_participants')
        .update({ 
          last_seen: now
        })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        ErrorHandler.logError('UPDATE_USER_ACTIVITY_INTELLIGENT', error);
      } else {
        console.log(`💓 [INTELLIGENT HEARTBEAT] Activité mise à jour - Groupe: ${groupId.slice(0,8)}, État: ${isActive ? 'actif' : 'passif'}`);
      }
    } catch (error) {
      ErrorHandler.logError('UPDATE_USER_ACTIVITY_INTELLIGENT', error);
    }
  }

  /**
   * Obtenir l'état de connexion d'un utilisateur dans un groupe
   */
  static async getUserConnectionState(groupId: string, userId: string): Promise<'connected' | 'waiting' | 'passive' | 'abandoned'> {
    try {
      const { data: participant, error } = await supabase
        .from('group_participants')
        .select('last_seen')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (error || !participant) {
        return 'abandoned';
      }

      const lastSeenTime = new Date(participant.last_seen).getTime();
      const now = Date.now();
      const timeSinceLastSeen = now - lastSeenTime;

      // États basés sur les nouveaux seuils intelligents
      if (timeSinceLastSeen <= GROUP_CONSTANTS.CONNECTION_THRESHOLD) {
        return 'connected'; // Vraiment connecté (5 minutes)
      } else if (timeSinceLastSeen <= GROUP_CONSTANTS.ACTIVE_GROUP_PROTECTION) {
        return 'waiting'; // En attente active (30 minutes)
      } else if (timeSinceLastSeen <= GROUP_CONSTANTS.GROUP_FORMATION_TIMEOUT) {
        return 'passive'; // Attente passive (1 heure)
      } else {
        return 'abandoned'; // Vraiment parti (1+ heure)
      }
    } catch (error) {
      ErrorHandler.logError('GET_USER_CONNECTION_STATE', error);
      return 'abandoned';
    }
  }

  /**
   * Obtenir les états de tous les participants d'un groupe
   */
  static async getGroupParticipantsStates(groupId: string): Promise<Array<{
    userId: string;
    state: 'connected' | 'waiting' | 'passive' | 'abandoned';
    lastSeen: string;
    timeSinceLastSeen: number;
  }>> {
    try {
      const { data: participants, error } = await supabase
        .from('group_participants')
        .select('user_id, last_seen')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');

      if (error || !participants) {
        return [];
      }

      const now = Date.now();
      return participants.map(p => {
        const lastSeenTime = new Date(p.last_seen).getTime();
        const timeSinceLastSeen = now - lastSeenTime;
        
        let state: 'connected' | 'waiting' | 'passive' | 'abandoned';
        if (timeSinceLastSeen <= GROUP_CONSTANTS.CONNECTION_THRESHOLD) {
          state = 'connected';
        } else if (timeSinceLastSeen <= GROUP_CONSTANTS.ACTIVE_GROUP_PROTECTION) {
          state = 'waiting';
        } else if (timeSinceLastSeen <= GROUP_CONSTANTS.GROUP_FORMATION_TIMEOUT) {
          state = 'passive';
        } else {
          state = 'abandoned';
        }

        return {
          userId: p.user_id,
          state,
          lastSeen: p.last_seen,
          timeSinceLastSeen
        };
      });
    } catch (error) {
      ErrorHandler.logError('GET_GROUP_PARTICIPANTS_STATES', error);
      return [];
    }
  }

  /**
   * Vérifier si un groupe est encore "vivant" basé sur l'activité des participants
   */
  static async isGroupStillLive(groupId: string): Promise<boolean> {
    try {
      const participants = await this.getGroupParticipantsStates(groupId);
      
      // Un groupe est vivant s'il a au moins un participant pas "abandonné"
      const liveParticipants = participants.filter(p => p.state !== 'abandoned');
      
      console.log(`🔍 [INTELLIGENT HEARTBEAT] Groupe ${groupId.slice(0,8)} - Participants vivants: ${liveParticipants.length}/${participants.length}`);
      
      return liveParticipants.length > 0;
    } catch (error) {
      ErrorHandler.logError('IS_GROUP_STILL_LIVE', error);
      return false;
    }
  }

  /**
   * Obtenir les participants qui doivent recevoir des notifications
   */
  static async getParticipantsForNotification(groupId: string): Promise<string[]> {
    try {
      const participants = await this.getGroupParticipantsStates(groupId);
      
      // Notifier tous les participants sauf les "abandonnés"
      const notifiableUsers = participants
        .filter(p => p.state !== 'abandoned')
        .map(p => p.userId);
      
      console.log(`📱 [INTELLIGENT HEARTBEAT] Groupe ${groupId.slice(0,8)} - ${notifiableUsers.length} utilisateurs à notifier`);
      
      return notifiableUsers;
    } catch (error) {
      ErrorHandler.logError('GET_PARTICIPANTS_FOR_NOTIFICATION', error);
      return [];
    }
  }

  /**
   * Statistiques d'activité pour debug
   */
  static async getActivityStats(groupId: string): Promise<any> {
    try {
      const participants = await this.getGroupParticipantsStates(groupId);
      
      const stats = {
        total: participants.length,
        connected: participants.filter(p => p.state === 'connected').length,
        waiting: participants.filter(p => p.state === 'waiting').length,
        passive: participants.filter(p => p.state === 'passive').length,
        abandoned: participants.filter(p => p.state === 'abandoned').length,
        live: participants.filter(p => p.state !== 'abandoned').length
      };

      console.log(`📊 [INTELLIGENT HEARTBEAT] Stats groupe ${groupId.slice(0,8)}:`, stats);
      return stats;
    } catch (error) {
      ErrorHandler.logError('GET_ACTIVITY_STATS', error);
      return null;
    }
  }

  /**
   * Déterminer la stratégie de notification pour un groupe
   */
  static async getNotificationStrategy(groupId: string): Promise<{
    shouldNotify: boolean;
    urgency: 'low' | 'medium' | 'high';
    message: string;
    recipients: string[];
  }> {
    try {
      const { data: group } = await supabase
        .from('groups')
        .select('status, created_at, current_participants, bar_name')
        .eq('id', groupId)
        .single();

      if (!group) {
        return { shouldNotify: false, urgency: 'low', message: '', recipients: [] };
      }

      const participants = await this.getGroupParticipantsStates(groupId);
      const liveParticipants = participants.filter(p => p.state !== 'abandoned');
      const recipients = liveParticipants.map(p => p.userId);

      const groupAge = Date.now() - new Date(group.created_at).getTime();
      
      // Stratégies de notification basées sur l'état du groupe
      if (group.status === 'confirmed' && group.bar_name) {
        return {
          shouldNotify: true,
          urgency: 'high',
          message: `🎉 Votre groupe est confirmé ! Rendez-vous au ${group.bar_name}`,
          recipients
        };
      }

      if (group.status === 'waiting' && group.current_participants >= 3) {
        return {
          shouldNotify: true,
          urgency: 'medium',
          message: `🔥 Votre groupe se remplit ! ${group.current_participants}/5 participants`,
          recipients
        };
      }

      if (group.status === 'waiting' && groupAge > 30 * 60 * 1000) { // 30 minutes
        return {
          shouldNotify: true,
          urgency: 'low',
          message: `⏰ Votre groupe recherche encore des participants (${group.current_participants}/5)`,
          recipients
        };
      }

      return { shouldNotify: false, urgency: 'low', message: '', recipients: [] };
    } catch (error) {
      ErrorHandler.logError('GET_NOTIFICATION_STRATEGY', error);
      return { shouldNotify: false, urgency: 'low', message: '', recipients: [] };
    }
  }
}