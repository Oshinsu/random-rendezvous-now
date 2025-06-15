
import { supabase } from '@/integrations/supabase/client';
import { GroupMember } from '@/types/groups';
import { Group } from '@/types/database';
import { LocationData } from '@/services/geolocation';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';

export class UnifiedGroupService {
  static isUserConnected(lastSeen: string): boolean {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    return diffMinutes <= 10;
  }

  static async updateUserLastSeen(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) {
        ErrorHandler.logError('UPDATE_LAST_SEEN', error);
      } else {
        console.log('✅ Last_seen mis à jour pour le groupe:', groupId);
      }
    } catch (error) {
      ErrorHandler.logError('UPDATE_USER_LAST_SEEN', error);
    }
  }

  static async forceCleanupOldGroups(): Promise<void> {
    try {
      console.log('🧹 Nettoyage forcé des groupes anciens...');
      
      const { error } = await supabase.rpc('dissolve_old_groups');
      
      if (error) {
        ErrorHandler.logError('FORCE_CLEANUP', error);
      } else {
        console.log('✅ Nettoyage des groupes anciens effectué');
      }
    } catch (error) {
      ErrorHandler.logError('FORCE_CLEANUP_OLD_GROUPS', error);
    }
  }

  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      await this.forceCleanupOldGroups();
      
      console.log('📋 Récupération des participations après nettoyage pour:', userId);
      
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
      ErrorHandler.logError('GET_USER_PARTICIPATIONS', error);
      return [];
    }
  }

  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 Récupération des membres avec statut de connexion:', groupId);
      
      const { data: participantsData, error: participantsError } = await supabase
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

      if (participantsError) {
        ErrorHandler.logError('FETCH_GROUP_MEMBERS', participantsError);
        const appError = ErrorHandler.handleSupabaseError(participantsError);
        ErrorHandler.showErrorToast(appError);
        return [];
      }

      const realParticipantCount = participantsData?.length || 0;
      console.log('🔍 Nombre RÉEL de participants confirmés:', realParticipantCount);

      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, status')
        .eq('id', groupId)
        .single();

      if (groupError) {
        ErrorHandler.logError('FETCH_GROUP_INFO', groupError);
      } else {
        console.log('📊 Comptage actuel en BDD:', currentGroup.current_participants, 'vs réel:', realParticipantCount);
        
        if (currentGroup.current_participants !== realParticipantCount) {
          console.log('🚨 INCOHÉRENCE DÉTECTÉE ! Correction forcée...');
          
          let newStatus = currentGroup.status;
          let updateData: any = {
            current_participants: realParticipantCount
          };

          if (realParticipantCount < 5 && currentGroup.status === 'confirmed') {
            newStatus = 'waiting';
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
            console.log('⏳ Remise en waiting et suppression du bar');
          }

          const { error: correctionError } = await supabase
            .from('groups')
            .update(updateData)
            .eq('id', groupId);

          if (correctionError) {
            ErrorHandler.logError('GROUP_COUNT_CORRECTION', correctionError);
          } else {
            console.log('✅ Comptage corrigé avec succès:', realParticipantCount);
          }
        }
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

      console.log('✅ Membres finaux avec statut de connexion:', members.map(m => ({ name: m.name, connected: m.isConnected })));
      return members;
    } catch (error) {
      ErrorHandler.logError('GET_GROUP_MEMBERS', error);
      return [];
    }
  }

  static async verifyUserAuthentication(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        ErrorHandler.logError('AUTH_CHECK', error);
        return false;
      }
      
      return !!user;
    } catch (error) {
      ErrorHandler.logError('AUTH_VERIFICATION', error);
      return false;
    }
  }

  static async createGroup(userLocation: LocationData, userId: string): Promise<Group | null> {
    try {
      console.log('🔐 Création d\'un nouveau groupe');
      
      const groupData = {
        status: 'waiting' as const,
        max_participants: 5,
        current_participants: 0,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        location_name: userLocation.locationName,
        search_radius: 10000
      };

      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (createError) {
        const appError = ErrorHandler.handleSupabaseError(createError);
        ErrorHandler.showErrorToast(appError);
        return null;
      }

      const participantData = {
        group_id: newGroup.id,
        user_id: userId,
        status: 'confirmed' as const,
        last_seen: new Date().toISOString(),
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        location_name: userLocation.locationName
      };

      const { error: joinError } = await supabase
        .from('group_participants')
        .insert(participantData);

      if (joinError) {
        await supabase.from('groups').delete().eq('id', newGroup.id);
        
        const appError = ErrorHandler.handleSupabaseError(joinError);
        ErrorHandler.showErrorToast(appError);
        return null;
      }

      console.log('✅ Groupe créé et utilisateur ajouté avec succès');
      
      const typedGroup: Group = {
        ...newGroup,
        status: newGroup.status as Group['status']
      };
      
      return typedGroup;
    } catch (error) {
      ErrorHandler.logError('CREATE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return null;
    }
  }

  static async joinGroup(groupId: string, userId: string, userLocation: LocationData): Promise<boolean> {
    try {
      console.log('🔐 Adhésion au groupe:', groupId);
      
      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (checkError) {
        const appError = ErrorHandler.handleSupabaseError(checkError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      if (existingParticipation) {
        toast({
          title: 'Déjà membre',
          description: 'Vous êtes déjà membre de ce groupe',
          variant: 'destructive'
        });
        return false;
      }

      const participantData = {
        group_id: groupId,
        user_id: userId,
        status: 'confirmed' as const,
        last_seen: new Date().toISOString(),
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        location_name: userLocation.locationName
      };

      const { error: joinError } = await supabase
        .from('group_participants')
        .insert(participantData);

      if (joinError) {
        const appError = ErrorHandler.handleSupabaseError(joinError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      console.log('✅ Adhésion réussie');
      return true;
    } catch (error) {
      ErrorHandler.logError('JOIN_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    }
  }

  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      console.log('🔐 Quitter le groupe:', groupId);
      
      const { error: leaveError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (leaveError) {
        const appError = ErrorHandler.handleSupabaseError(leaveError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      console.log('✅ Groupe quitté avec succès');
      return true;
    } catch (error) {
      ErrorHandler.logError('LEAVE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    }
  }

  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) {
        ErrorHandler.logError('UPDATE_USER_ACTIVITY', error);
      }
    } catch (error) {
      ErrorHandler.logError('UPDATE_USER_ACTIVITY', error);
    }
  }
}
