
import { supabase } from '@/integrations/supabase/client';
import { GroupMember } from '@/types/groups';
import { ErrorHandler } from '@/utils/errorHandling';

export class SecureGroupMembersService {
  static isUserConnected(lastSeen: string): boolean {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffMinutes <= 10;
  }

  static async getSecureGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('🔐 Récupération sécurisée des membres du groupe:', groupId);
      
      const { data: participantsData, error } = await supabase
        .from('group_participants')
        .select(`
          id,
          user_id,
          joined_at,
          status,
          last_seen
        `)
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: true });

      if (error) {
        ErrorHandler.logError('FETCH_GROUP_MEMBERS', error);
        const appError = ErrorHandler.handleSupabaseError(error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }

      if (!participantsData) {
        return [];
      }

      const members: GroupMember[] = participantsData.map((participant: any, index: number) => {
        const maskedName = `Rander ${index + 1}`;
        const lastSeenValue = participant.last_seen || participant.joined_at;
        const isConnected = this.isUserConnected(lastSeenValue);

        return {
          id: participant.id,
          name: maskedName,
          isConnected: isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: lastSeenValue
        };
      });

      console.log('✅ Membres récupérés avec succès:', members.length);
      return members;
    } catch (error) {
      ErrorHandler.logError('GET_SECURE_GROUP_MEMBERS', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return [];
    }
  }

  static async getUserSecureParticipations(userId: string): Promise<any[]> {
    try {
      console.log('🔐 Récupération sécurisée des participations pour:', userId);
      
      // Forcer le nettoyage d'abord
      await this.forceSecureCleanup();
      
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          id,
          group_id,
          joined_at,
          status,
          groups!inner(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (error) {
        ErrorHandler.logError('FETCH_USER_PARTICIPATIONS', error);
        const appError = ErrorHandler.handleSupabaseError(error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }

      return data || [];
    } catch (error) {
      ErrorHandler.logError('GET_USER_SECURE_PARTICIPATIONS', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return [];
    }
  }

  static async forceSecureCleanup(): Promise<void> {
    try {
      console.log('🔐 Nettoyage sécurisé des groupes anciens...');
      
      const { error } = await supabase.rpc('dissolve_old_groups');
      
      if (error) {
        ErrorHandler.logError('FORCE_SECURE_CLEANUP', error);
      } else {
        console.log('✅ Nettoyage sécurisé effectué');
      }
    } catch (error) {
      ErrorHandler.logError('FORCE_SECURE_CLEANUP', error);
    }
  }

  static async getSecureParticipantCount(groupId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('id', { count: 'exact' })
        .eq('group_id', groupId)
        .eq('status', 'confirmed');
      
      if (error) {
        ErrorHandler.logError('GET_PARTICIPANT_COUNT', error);
        return 0;
      }
      
      return data?.length || 0;
    } catch (error) {
      ErrorHandler.logError('GET_SECURE_PARTICIPANT_COUNT', error);
      return 0;
    }
  }
}
