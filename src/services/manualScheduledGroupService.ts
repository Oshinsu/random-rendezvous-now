import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database';

export interface ManualScheduledGroup extends Group {
  city_name?: string;
  bar_name_manual?: string;
  bar_address_manual?: string;
  created_by_user_id?: string;
  scheduled_for?: string;
}

export interface CreateManualScheduledGroupData {
  scheduledFor: Date;
  cityName: string;
  barName: string;
  barAddress: string;
}

export class ManualScheduledGroupService {
  static async createScheduledGroup(data: CreateManualScheduledGroupData, userId: string) {
    try {
      // Validation
      if (data.scheduledFor <= new Date()) {
        throw new Error('La date programmée doit être dans le futur');
      }

      if (!data.cityName || !data.barName || !data.barAddress) {
        throw new Error('Tous les champs sont requis');
      }

      // Check for existing active groups
      const { data: existingGroups, error: checkError } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(*)')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (checkError) {
        console.error('Error checking existing groups:', checkError);
        throw new Error('Erreur lors de la vérification des groupes existants');
      }

      if (existingGroups && existingGroups.length > 0) {
        throw new Error('Vous êtes déjà dans un groupe actif');
      }

      // Check for nearby scheduled groups (within 2 hours)
      const twoHoursBefore = new Date(data.scheduledFor.getTime() - 2 * 60 * 60 * 1000);
      const twoHoursAfter = new Date(data.scheduledFor.getTime() + 2 * 60 * 60 * 1000);

      const { data: conflictingGroups, error: conflictError } = await supabase
        .from('groups')
        .select('*')
        .eq('is_scheduled', true)
        .eq('city_name', data.cityName)
        .gte('scheduled_for', twoHoursBefore.toISOString())
        .lte('scheduled_for', twoHoursAfter.toISOString())
        .in('status', ['waiting', 'confirmed']);

      if (conflictError) {
        console.error('Error checking conflicting groups:', conflictError);
        throw new Error('Erreur lors de la vérification des conflits');
      }

      if (conflictingGroups && conflictingGroups.length > 0) {
        throw new Error('Un groupe est déjà programmé à une heure similaire dans cette ville');
      }

      // Create the scheduled group
      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert({
          status: 'waiting',
          max_participants: 5,
          current_participants: 1,
          is_scheduled: true,
          scheduled_for: data.scheduledFor.toISOString(),
          city_name: data.cityName,
          bar_name_manual: data.barName,
          bar_address_manual: data.barAddress,
          created_by_user_id: userId
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating group:', createError);
        throw new Error('Erreur lors de la création du groupe');
      }

      // Add creator as participant
      const { error: participantError } = await supabase
        .from('group_participants')
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          status: 'confirmed',
          joined_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        });

      if (participantError) {
        console.error('Error adding participant:', participantError);
        throw new Error('Erreur lors de l\'ajout du participant');
      }

      return { success: true, groupId: newGroup.id };
    } catch (error) {
      console.error('Error in createScheduledGroup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite' };
    }
  }

  static async getUserScheduledGroups(userId: string): Promise<ManualScheduledGroup[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by_user_id', userId)
        .eq('is_scheduled', true)
        .gte('scheduled_for', new Date().toISOString())
        .in('status', ['waiting', 'confirmed'])
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching user scheduled groups:', error);
        return [];
      }

      return (data || []) as ManualScheduledGroup[];
    } catch (error) {
      console.error('Error in getUserScheduledGroups:', error);
      return [];
    }
  }

  static async getAllScheduledGroups(): Promise<ManualScheduledGroup[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_scheduled', true)
        .gte('scheduled_for', new Date().toISOString())
        .in('status', ['waiting', 'confirmed'])
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching all scheduled groups:', error);
        return [];
      }

      return (data || []) as ManualScheduledGroup[];
    } catch (error) {
      console.error('Error in getAllScheduledGroups:', error);
      return [];
    }
  }

  static async joinScheduledGroup(groupId: string, userId: string) {
    try {
      // Check if user is already in an active group
      const { data: existingGroups, error: checkError } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(*)')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (checkError) {
        console.error('Error checking existing groups:', checkError);
        throw new Error('Erreur lors de la vérification des groupes existants');
      }

      if (existingGroups && existingGroups.length > 0) {
        throw new Error('Vous êtes déjà dans un groupe actif');
      }

      // Check if group is available
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        throw new Error('Groupe non trouvé');
      }

      if (group.current_participants >= group.max_participants) {
        throw new Error('Ce groupe est complet');
      }

      // Add participant
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: groupId,
          user_id: userId,
          status: 'confirmed',
          joined_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        });

      if (joinError) {
        console.error('Error joining group:', joinError);
        throw new Error('Erreur lors de la participation au groupe');
      }

      return { success: true };
    } catch (error) {
      console.error('Error in joinScheduledGroup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite' };
    }
  }

  static async cancelScheduledGroup(groupId: string, userId: string) {
    try {
      // Check if user is the creator
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .eq('created_by_user_id', userId)
        .single();

      if (groupError || !group) {
        throw new Error('Groupe non trouvé ou non autorisé');
      }

      // Update group status to cancelled
      const { error: updateError } = await supabase
        .from('groups')
        .update({ status: 'cancelled' })
        .eq('id', groupId);

      if (updateError) {
        console.error('Error cancelling group:', updateError);
        throw new Error('Erreur lors de l\'annulation du groupe');
      }

      return { success: true };
    } catch (error) {
      console.error('Error in cancelScheduledGroup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite' };
    }
  }
}