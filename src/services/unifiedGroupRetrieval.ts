
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';
import type { Group } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export class UnifiedGroupRetrievalService {
  /**
   * Get user participations WITHOUT automatic filtering - retrieve all active participations
   */
  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      console.log('🔍 [UNIFIED] Récupération des participations pour:', userId);
      
      // REMOVED: Automatic filtering by last_seen - we retrieve ALL active participations
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
        .in('groups.status', ['waiting', 'confirmed']);
        // REMOVED: .gte('last_seen', thresholdTime) - No more automatic filtering!

      if (error) {
        ErrorHandler.logError('UNIFIED_GET_USER_PARTICIPATIONS', error);
        return [];
      }

      console.log('✅ [UNIFIED] Participations trouvées (sans filtrage automatique):', data?.length || 0);
      
      // Log details about each participation for debugging
      if (data && data.length > 0) {
        data.forEach((participation, index) => {
          const lastSeen = participation.last_seen;
          const timeSinceLastSeen = lastSeen ? (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60) : 'N/A';
          console.log(`📋 [UNIFIED] Participation ${index + 1}:`, {
            groupId: participation.group_id,
            groupStatus: participation.groups?.status,
            lastSeen: lastSeen,
            minutesSinceLastSeen: typeof timeSinceLastSeen === 'number' ? Math.round(timeSinceLastSeen) : timeSinceLastSeen
          });
        });
      }
      
      return data || [];
    } catch (error) {
      ErrorHandler.logError('UNIFIED_GET_USER_PARTICIPATIONS', error);
      return [];
    }
  }

  /**
   * Client-side filtering for display purposes - separate from retrieval
   */
  static filterActiveParticipations(participations: any[]): any[] {
    const thresholdTime = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_INACTIVE_THRESHOLD);
    
    const activeParticipations = participations.filter(participation => {
      const lastSeen = participation.last_seen;
      if (!lastSeen) return true; // Keep if no last_seen (shouldn't happen but be safe)
      
      const lastSeenDate = new Date(lastSeen);
      const isActive = lastSeenDate >= thresholdTime;
      
      if (!isActive) {
        console.log('🚫 [UNIFIED] Participation filtrée (inactive):', {
          groupId: participation.group_id,
          lastSeen: lastSeen,
          thresholdTime: thresholdTime.toISOString(),
          minutesSinceLastSeen: Math.round((Date.now() - lastSeenDate.getTime()) / (1000 * 60))
        });
      }
      
      return isActive;
    });
    
    console.log('✅ [UNIFIED] Participations actives après filtrage client:', activeParticipations.length);
    return activeParticipations;
  }

  /**
   * Get group members with connection status
   */
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 [UNIFIED] Récupération des membres pour:', groupId);
      
      // Get all confirmed participants (no filtering by last_seen at DB level)
      const { data: participantsData, error } = await supabase
        .from('group_participants')
        .select('id, user_id, joined_at, status, last_seen')
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
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
        
        // More lenient connection detection - 30 minutes instead of 10
        const isConnected = inactiveTime < (30 * 60 * 1000);

        console.log(`👤 [UNIFIED] Membre ${maskedName}:`, {
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

      console.log('✅ [UNIFIED] Membres récupérés:', members.length);
      return members;
    } catch (error) {
      ErrorHandler.logError('UNIFIED_GET_GROUP_MEMBERS', error);
      return [];
    }
  }

  /**
   * Update user activity (last_seen) with detailed logging
   */
  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      console.log('⏰ [UNIFIED] Mise à jour last_seen:', { groupId, userId, timestamp: now });
      
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: now })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) {
        ErrorHandler.logError('UNIFIED_UPDATE_USER_ACTIVITY', error);
      } else {
        console.log('✅ [UNIFIED] Activité mise à jour avec succès:', userId);
      }
    } catch (error) {
      ErrorHandler.logError('UNIFIED_UPDATE_USER_ACTIVITY', error);
    }
  }

  /**
   * Validate and extract groups from participations with improved logging
   */
  static extractValidGroups(participations: any[]): Group[] {
    const validGroups: Group[] = [];
    
    console.log('🔍 [UNIFIED] Extraction des groupes valides depuis:', participations.length, 'participations');
    
    for (const participation of participations) {
      const group = participation.groups;
      if (!group) {
        console.log('⚠️ [UNIFIED] Participation sans groupe trouvée:', participation.id);
        continue;
      }
      
      console.log('✅ [UNIFIED] Groupe valide extrait:', {
        groupId: group.id,
        status: group.status,
        participants: group.current_participants,
        locationName: group.location_name
      });
      
      validGroups.push(group as Group);
    }
    
    console.log('✅ [UNIFIED] Groupes valides extraits:', validGroups.length);
    return validGroups;
  }
}
