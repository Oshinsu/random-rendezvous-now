import { supabase } from '@/integrations/supabase/client';
import { LocationData } from './geolocation';
import { Group } from '@/types/database';

export interface ScheduledGroup extends Group {
  is_scheduled: boolean;
  scheduled_for?: string;
  reminder_sent?: boolean;
  created_by_user_id?: string;
}

export class ScheduledGroupService {
  /**
   * Create a scheduled group for a future date/time
   */
  static async createScheduledGroup(
    userLocation: LocationData,
    scheduledFor: Date,
    userId: string
  ): Promise<{ success: boolean; groupId?: string; error?: string }> {
    try {
      // Validate scheduled time is in the future
      if (scheduledFor <= new Date()) {
        return { success: false, error: 'La date planifiée doit être dans le futur' };
      }

      // Check if user already has a scheduled group for the same time period
      const { data: existingGroups, error: checkError } = await supabase
        .from('groups')
        .select('id')
        .eq('created_by_user_id', userId)
        .eq('is_scheduled', true)
        .gte('scheduled_for', new Date(scheduledFor.getTime() - 2 * 60 * 60 * 1000).toISOString()) // 2h before
        .lte('scheduled_for', new Date(scheduledFor.getTime() + 2 * 60 * 60 * 1000).toISOString()); // 2h after

      if (checkError) {
        console.error('Error checking existing groups:', checkError);
        return { success: false, error: 'Erreur lors de la vérification des groupes existants' };
      }

      if (existingGroups && existingGroups.length > 0) {
        return { success: false, error: 'Vous avez déjà un groupe planifié dans cette période' };
      }

      // Create the scheduled group
      const { data: group, error: createError } = await supabase
        .from('groups')
        .insert({
          status: 'waiting',
          max_participants: 5,
          current_participants: 1,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          location_name: userLocation.locationName,
          search_radius: 10000,
          is_scheduled: true,
          scheduled_for: scheduledFor.toISOString(),
          reminder_sent: false,
          created_by_user_id: userId
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating scheduled group:', createError);
        return { success: false, error: 'Erreur lors de la création du groupe planifié' };
      }

      // Add the creator as a participant
      const { error: participantError } = await supabase
        .from('group_participants')
        .insert({
          group_id: group.id,
          user_id: userId,
          status: 'confirmed',
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          location_name: userLocation.locationName,
          last_seen: new Date().toISOString()
        });

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
  static async getUserScheduledGroups(userId: string): Promise<ScheduledGroup[]> {
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

      return (groups || []) as ScheduledGroup[];
    } catch (error) {
      console.error('Unexpected error fetching scheduled groups:', error);
      return [];
    }
  }

  /**
   * Get all upcoming scheduled groups (for admin/system use)
   */
  static async getUpcomingScheduledGroups(): Promise<ScheduledGroup[]> {
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_scheduled', true)
        .lte('scheduled_for', inOneHour.toISOString())
        .gte('scheduled_for', now.toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching upcoming scheduled groups:', error);
        return [];
      }

      return (groups || []) as ScheduledGroup[];
    } catch (error) {
      console.error('Unexpected error fetching upcoming groups:', error);
      return [];
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