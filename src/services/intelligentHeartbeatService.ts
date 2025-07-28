import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

/**
 * SERVICE DE BATTEMENT DE CŒUR INTELLIGENT
 * 
 * Distingue entre:
 * - "Connecté" : utilisateur actif sur l'app (5 minutes)
 * - "En attente" : utilisateur pas sur l'app mais groupe récent (30 minutes)
 * - "Passif" : utilisateur en attente mais disponible pour notifications (1 heure)
 * - "Abandonné" : utilisateur vraiment parti (6+ heures)
 */
export class IntelligentHeartbeatService {
  
  /**
   * Mise à jour d'activité avec état intelligent
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