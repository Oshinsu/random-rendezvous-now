
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export class EnhancedGroupRetrievalService {
  /**
   * Récupération AMÉLIORÉE des participations utilisateur avec filtrage UNIFIÉ
   */
  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      // Log silently reduced to avoid spam
      
      // Utiliser le seuil unifié pour la récupération
      const thresholdTime = new Date(Date.now() - GROUP_CONSTANTS.CLEANUP_THRESHOLDS.VERY_OLD_GROUPS).toISOString();
      
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          id,
          group_id,
          joined_at,
          status,
          last_seen,
          groups!inner(
            id,
            status,
            created_at,
            current_participants,
            max_participants,
            latitude,
            longitude,
            location_name,
            search_radius,
            bar_name,
            bar_address,
            meeting_time,
            bar_latitude,
            bar_longitude,
            bar_place_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed'])
        .gte('last_seen', thresholdTime); // Filtrage unifié

      if (error) {
        ErrorHandler.logError('ENHANCED_GET_USER_PARTICIPATIONS', error);
        return [];
      }

      // Silent logging - reduced spam
      return data || [];
    } catch (error) {
      ErrorHandler.logError('ENHANCED_GET_USER_PARTICIPATIONS', error);
      return [];
    }
  }

  /**
   * Filtrage côté client UNIFIÉ et MOINS STRICT
   */
  static filterActiveParticipations(participations: any[]): any[] {
    // Utiliser le seuil unifié pour le filtrage côté client
    const thresholdTime = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_INACTIVE_THRESHOLD);
    
    const activeParticipations = participations.filter(participation => {
      const lastSeen = participation.last_seen;
      if (!lastSeen) return true; // Garder si pas de last_seen
      
      const lastSeenDate = new Date(lastSeen);
      const isActive = lastSeenDate >= thresholdTime;
      
      if (!isActive) {
        console.log('🚫 [ENHANCED] Participation filtrée (inactive depuis 3h+):', {
          groupId: participation.group_id,
          lastSeen: lastSeen,
          hoursSinceLastSeen: Math.round((Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60))
        });
      }
      
      return isActive;
    });
    
    // Silent logging - reduced spam
    return activeParticipations;
  }

  /**
   * Auto-récupération AMÉLIORÉE avec mise à jour last_seen
   */
  static async recoverUserActivity(userId: string, participations: any[]): Promise<void> {
    try {
      console.log('🔄 [ENHANCED] Auto-récupération améliorée pour:', userId);
      
      const now = new Date().toISOString();
      
      for (const participation of participations) {
        await this.updateUserActivity(participation.group_id, userId);
      }
      
      console.log('✅ [ENHANCED] Auto-récupération terminée');
    } catch (error) {
      ErrorHandler.logError('ENHANCED_RECOVER_USER_ACTIVITY', error);
    }
  }

  /**
   * Récupération des membres avec statut de connexion UNIFIÉ
   */
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 [ENHANCED] Récupération des membres pour:', groupId);
      
      const { data: participantsData, error } = await supabase
        .from('group_participants')
        .select('id, user_id, joined_at, status, last_seen')
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: true });

      if (error) {
        ErrorHandler.logError('ENHANCED_GET_GROUP_MEMBERS', error);
        return [];
      }

      const members: GroupMember[] = (participantsData || []).map((participant, index) => {
        const maskedName = `Rander ${index + 1}`;
        const lastSeenValue = participant.last_seen || participant.joined_at;
        const lastSeenTime = new Date(lastSeenValue).getTime();
        const now = Date.now();
        const inactiveTime = now - lastSeenTime;
        
        // Utiliser le seuil unifié pour le statut de connexion
        const isConnected = inactiveTime < GROUP_CONSTANTS.CONNECTION_THRESHOLD;

        console.log(`👤 [ENHANCED] Membre ${maskedName}:`, {
          lastSeen: lastSeenValue,
          minutesSinceLastSeen: Math.round(inactiveTime / (1000 * 60)),
          isConnected: isConnected
        });

        return {
          id: participant.id,
          name: maskedName,
          isConnected: isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: lastSeenValue
        };
      });

      console.log('✅ [ENHANCED] Membres récupérés avec statut unifié:', members.length);
      return members;
    } catch (error) {
      ErrorHandler.logError('ENHANCED_GET_GROUP_MEMBERS', error);
      return [];
    }
  }

  /**
   * Mise à jour d'activité AMÉLIORÉE
   */
  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      console.log('⏰ [ENHANCED] Mise à jour activité unifiée:', { groupId, userId, timestamp: now });
      
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: now })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) {
        ErrorHandler.logError('ENHANCED_UPDATE_USER_ACTIVITY', error);
      } else {
        console.log('✅ [ENHANCED] Activité mise à jour avec succès');
      }
    } catch (error) {
      ErrorHandler.logError('ENHANCED_UPDATE_USER_ACTIVITY', error);
    }
  }

  /**
   * Extraction des groupes valides avec validation AMÉLIORÉE
   */
  static extractValidGroups(participations: any[]): Group[] {
    const validGroups: Group[] = [];
    
    console.log('🔍 [ENHANCED] Extraction groupes valides depuis:', participations.length, 'participations');
    
    for (const participation of participations) {
      const group = participation.groups;
      if (!group) {
        console.log('⚠️ [ENHANCED] Participation sans groupe trouvée:', participation.id);
        continue;
      }
      
      console.log('✅ [ENHANCED] Groupe valide extrait:', {
        groupId: group.id,
        status: group.status,
        participants: group.current_participants,
        locationName: group.location_name
      });
      
      validGroups.push(group as Group);
    }
    
    // Silent logging - reduced spam
    return validGroups;
  }
}
