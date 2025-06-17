
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export class UnifiedGroupRetrievalService {
  /**
   * Get user participations with unified filtering logic
   */
  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      console.log('🔍 [UNIFIED] Récupération des participations pour:', userId);
      
      const thresholdTime = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_INACTIVE_THRESHOLD).toISOString();
      
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
        .gte('last_seen', thresholdTime);

      if (error) {
        ErrorHandler.logError('UNIFIED_GET_USER_PARTICIPATIONS', error);
        return [];
      }

      console.log('✅ [UNIFIED] Participations trouvées:', data?.length || 0);
      return data || [];
    } catch (error) {
      ErrorHandler.logError('UNIFIED_GET_USER_PARTICIPATIONS', error);
      return [];
    }
  }

  /**
   * Get group members with connection status
   */
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 [UNIFIED] Récupération des membres pour:', groupId);
      
      const thresholdTime = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_INACTIVE_THRESHOLD).toISOString();
      
      const { data: participantsData, error } = await supabase
        .from('group_participants')
        .select('id, user_id, joined_at, status, last_seen')
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .gte('last_seen', thresholdTime)
        .order('joined_at', { ascending: true });

      if (error) {
        ErrorHandler.logError('UNIFIED_GET_GROUP_MEMBERS', error);
        return [];
      }

      const members: GroupMember[] = (participantsData || []).map((participant, index) => {
        const maskedName = `Rander ${index + 1}`;
        const lastSeenValue = participant.last_seen || participant.joined_at;
        const lastSeenTime = new Date(lastSeenValue).getTime();
        const now = Date.now();
        const inactiveTime = now - lastSeenTime;
        const isConnected = inactiveTime < (10 * 60 * 1000); // 10 minutes for "connected" status

        return {
          id: participant.id,
          name: maskedName,
          isConnected: isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: lastSeenValue
        };
      });

      console.log('✅ [UNIFIED] Membres récupérés:', members.length);
      return members;
    } catch (error) {
      ErrorHandler.logError('UNIFIED_GET_GROUP_MEMBERS', error);
      return [];
    }
  }

  /**
   * Update user activity (last_seen)
   */
  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) {
        ErrorHandler.logError('UNIFIED_UPDATE_USER_ACTIVITY', error);
      } else {
        console.log('✅ [UNIFIED] Activité mise à jour pour:', userId);
      }
    } catch (error) {
      ErrorHandler.logError('UNIFIED_UPDATE_USER_ACTIVITY', error);
    }
  }

  /**
   * Validate and extract groups from participations
   */
  static extractValidGroups(participations: any[]): Group[] {
    const validGroups: Group[] = [];
    
    for (const participation of participations) {
      const group = participation.groups;
      if (!group) continue;
      
      // Additional validation can be added here if needed
      validGroups.push(group as Group);
    }
    
    console.log('✅ [UNIFIED] Groupes valides extraits:', validGroups.length);
    return validGroups;
  }
}
