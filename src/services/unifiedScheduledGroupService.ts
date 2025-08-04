import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database';
import { LocationData } from './geolocation';

export interface UnifiedScheduledGroup extends Group {
  is_scheduled: boolean;
  scheduled_for?: string;
  reminder_sent?: boolean;
  created_by_user_id?: string;
  city_name?: string;
  bar_name_manual?: string;
  bar_address_manual?: string;
}

export interface CreateScheduledGroupData {
  scheduledFor: Date;
  // Automatic mode (geolocation-based)
  userLocation?: LocationData;
  // Manual mode (city/bar selection)
  cityName?: string;
  barName?: string;
  barAddress?: string;
}

export class UnifiedScheduledGroupService {
  /**
   * Create a scheduled group - supports both automatic and manual modes
   */
  static async createScheduledGroup(
    data: CreateScheduledGroupData,
    userId: string
  ): Promise<{ success: boolean; groupId?: string; error?: string }> {
    try {
      // Validate scheduled time is in the future
      if (data.scheduledFor <= new Date()) {
        return { success: false, error: 'La date planifiée doit être dans le futur' };
      }

      const isManualMode = Boolean(data.cityName && data.barName && data.barAddress);
      const isAutomaticMode = Boolean(data.userLocation);

      if (!isManualMode && !isAutomaticMode) {
        return { success: false, error: 'Données insuffisantes pour créer le groupe' };
      }

      // Check if user already has an active group
      const { data: existingParticipations, error: checkError } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(*)')
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (checkError) {
        console.error('Error checking existing groups:', checkError);
        return { success: false, error: 'Erreur lors de la vérification des groupes existants' };
      }

      if (existingParticipations && existingParticipations.length > 0) {
        return { success: false, error: 'Vous êtes déjà dans un groupe actif' };
      }

      // Check for conflicting scheduled groups in the same time window
      const twoHoursBefore = new Date(data.scheduledFor.getTime() - 2 * 60 * 60 * 1000);
      const twoHoursAfter = new Date(data.scheduledFor.getTime() + 2 * 60 * 60 * 1000);

      let conflictQuery = supabase
        .from('groups')
        .select('id')
        .eq('is_scheduled', true)
        .gte('scheduled_for', twoHoursBefore.toISOString())
        .lte('scheduled_for', twoHoursAfter.toISOString())
        .in('status', ['waiting', 'confirmed']);

      // For manual mode, check conflicts in the same city
      if (isManualMode) {
        conflictQuery = conflictQuery.eq('city_name', data.cityName);
      } else {
        // For automatic mode, check conflicts by user
        conflictQuery = conflictQuery.eq('created_by_user_id', userId);
      }

      const { data: conflictingGroups, error: conflictError } = await conflictQuery;

      if (conflictError) {
        console.error('Error checking conflicting groups:', conflictError);
        return { success: false, error: 'Erreur lors de la vérification des conflits' };
      }

      if (conflictingGroups && conflictingGroups.length > 0) {
        const errorMsg = isManualMode 
          ? 'Un groupe est déjà programmé à une heure similaire dans cette ville'
          : 'Vous avez déjà un groupe planifié dans cette période';
        return { success: false, error: errorMsg };
      }

      // Prepare group data
      const groupData: any = {
        status: 'waiting',
        max_participants: 5,
        current_participants: 1,
        is_scheduled: true,
        scheduled_for: data.scheduledFor.toISOString(),
        reminder_sent: false,
        created_by_user_id: userId
      };

      if (isManualMode) {
        // Manual mode - specific city and bar
        groupData.city_name = data.cityName;
        groupData.bar_name_manual = data.barName;
        groupData.bar_address_manual = data.barAddress;
      } else {
        // Automatic mode - geolocation based
        groupData.latitude = data.userLocation!.latitude;
        groupData.longitude = data.userLocation!.longitude;
        groupData.location_name = data.userLocation!.locationName;
        groupData.search_radius = 10000;
      }

      // Create the scheduled group
      const { data: group, error: createError } = await supabase
        .from('groups')
        .insert(groupData)
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating scheduled group:', createError);
        return { success: false, error: 'Erreur lors de la création du groupe planifié' };
      }

      // Add the creator as a participant
      const participantData: any = {
        group_id: group.id,
        user_id: userId,
        status: 'confirmed',
        last_seen: new Date().toISOString()
      };

      if (isAutomaticMode) {
        participantData.latitude = data.userLocation!.latitude;
        participantData.longitude = data.userLocation!.longitude;
        participantData.location_name = data.userLocation!.locationName;
      }

      const { error: participantError } = await supabase
        .from('group_participants')
        .insert(participantData);

      if (participantError) {
        console.error('Error adding participant:', participantError);
        // Clean up the group if participant addition fails
        await supabase.from('groups').delete().eq('id', group.id);
        return { success: false, error: 'Erreur lors de l\'ajout du participant' };
      }

      return { success: true, groupId: group.id };
    } catch (error) {
      console.error('Unexpected error creating scheduled group:', error);
      return { success: false, error: 'Erreur inattendue lors de la création du groupe' };
    }
  }

  /**
   * Get user's scheduled groups
   */
  static async getUserScheduledGroups(userId: string): Promise<UnifiedScheduledGroup[]> {
    try {
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('created_by_user_id', userId)
        .eq('is_scheduled', true)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled groups:', error);
        return [];
      }

      return (groups || []) as UnifiedScheduledGroup[];
    } catch (error) {
      console.error('Unexpected error fetching scheduled groups:', error);
      return [];
    }
  }

  /**
   * Get all available scheduled groups (excluding user's own groups)
   */
  static async getAllAvailableScheduledGroups(userId: string): Promise<UnifiedScheduledGroup[]> {
    try {
      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_scheduled', true)
        .eq('status', 'waiting')
        .neq('created_by_user_id', userId)
        .lt('current_participants', 5)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching available scheduled groups:', error);
        return [];
      }

      return (groups || []) as UnifiedScheduledGroup[];
    } catch (error) {
      console.error('Unexpected error fetching available groups:', error);
      return [];
    }
  }

  /**
   * Join a scheduled group
   */
  static async joinScheduledGroup(groupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
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
        return { success: false, error: 'Erreur lors de la vérification des groupes existants' };
      }

      if (existingGroups && existingGroups.length > 0) {
        return { success: false, error: 'Vous êtes déjà dans un groupe actif' };
      }

      // Check if group is available
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        return { success: false, error: 'Groupe non trouvé' };
      }

      if (group.current_participants >= group.max_participants) {
        return { success: false, error: 'Ce groupe est complet' };
      }

      if (group.status !== 'waiting') {
        return { success: false, error: 'Ce groupe n\'est plus disponible' };
      }

      // Add participant
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: groupId,
          user_id: userId,
          status: 'confirmed',
          last_seen: new Date().toISOString()
        });

      if (joinError) {
        console.error('Error joining group:', joinError);
        return { success: false, error: 'Erreur lors de la participation au groupe' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error joining group:', error);
      return { success: false, error: 'Erreur inattendue lors de la participation' };
    }
  }

  /**
   * Cancel a scheduled group
   */
  static async cancelScheduledGroup(groupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify the user owns this scheduled group
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('created_by_user_id, is_scheduled, status')
        .eq('id', groupId)
        .single();

      if (fetchError) {
        console.error('Error fetching group:', fetchError);
        return { success: false, error: 'Groupe non trouvé' };
      }

      if (group.created_by_user_id !== userId) {
        return { success: false, error: 'Vous n\'êtes pas autorisé à annuler ce groupe' };
      }

      if (!group.is_scheduled) {
        return { success: false, error: 'Ce groupe n\'est pas planifié' };
      }

      if (group.status === 'completed' || group.status === 'cancelled') {
        return { success: false, error: 'Ce groupe ne peut plus être annulé' };
      }

      // Update group status to cancelled
      const { error: updateError } = await supabase
        .from('groups')
        .update({ status: 'cancelled' })
        .eq('id', groupId);

      if (updateError) {
        console.error('Error cancelling group:', updateError);
        return { success: false, error: 'Erreur lors de l\'annulation du groupe' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error cancelling group:', error);
      return { success: false, error: 'Erreur inattendue lors de l\'annulation' };
    }
  }

  /**
   * Delete a scheduled group (only for waiting or cancelled groups)
   */
  static async deleteScheduledGroup(groupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('created_by_user_id', userId)
        .in('status', ['waiting', 'cancelled']);

      if (error) {
        console.error('Error deleting group:', error);
        return { success: false, error: 'Erreur lors de la suppression du groupe' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting group:', error);
      return { success: false, error: 'Erreur inattendue lors de la suppression' };
    }
  }

  /**
   * Activate scheduled groups that are ready to go live
   */
  static async activateReadyGroups(): Promise<number> {
    try {
      const now = new Date();
      
      // Find scheduled groups that should be activated (scheduled time has arrived)
      const { data: groupsToActivate, error: fetchError } = await supabase
        .from('groups')
        .select('id')
        .eq('is_scheduled', true)
        .eq('status', 'waiting')
        .lte('scheduled_for', now.toISOString());

      if (fetchError) {
        console.error('Error fetching groups to activate:', fetchError);
        return 0;
      }

      if (!groupsToActivate || groupsToActivate.length === 0) {
        return 0;
      }

      // Activate the groups by removing the scheduled flag
      const groupIds = groupsToActivate.map(g => g.id);
      const { error: updateError } = await supabase
        .from('groups')
        .update({ 
          is_scheduled: false,
          scheduled_for: null 
        })
        .in('id', groupIds);

      if (updateError) {
        console.error('Error activating groups:', updateError);
        return 0;
      }

      return groupsToActivate.length;
    } catch (error) {
      console.error('Unexpected error activating groups:', error);
      return 0;
    }
  }
}