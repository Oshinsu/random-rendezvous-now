import { supabase } from '@/integrations/supabase/client';

/**
 * Helper function to create test data for outings history
 * This is for development/testing purposes only
 */
export const createTestOutingHistory = async (userId: string) => {
  console.log('🧪 [createTestOutingHistory] Creating test outing for user:', userId);
  
  try {
    // Create a test group first
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        status: 'completed',
        bar_name: 'Test Bar',
        bar_address: '123 Test Street, Test City',
        meeting_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        completed_at: new Date().toISOString(),
        max_participants: 5,
        current_participants: 2,
        bar_latitude: 48.8566,
        bar_longitude: 2.3522
      })
      .select()
      .single();

    if (groupError) {
      console.error('❌ [createTestOutingHistory] Error creating test group:', groupError);
      throw groupError;
    }

    console.log('✅ [createTestOutingHistory] Created test group:', group.id);

    // Add user as participant
    const { error: participantError } = await supabase
      .from('group_participants')
      .insert({
        group_id: group.id,
        user_id: userId,
        status: 'confirmed'
      });

    if (participantError) {
      console.error('❌ [createTestOutingHistory] Error adding participant:', participantError);
      throw participantError;
    }

    // Manually create the history entry (since the trigger might not fire for existing completed groups)
    const { data: history, error: historyError } = await supabase
      .from('user_outings_history')
      .insert({
        user_id: userId,
        group_id: group.id,
        bar_name: group.bar_name,
        bar_address: group.bar_address,
        meeting_time: group.meeting_time,
        participants_count: group.current_participants,
        bar_latitude: group.bar_latitude,
        bar_longitude: group.bar_longitude
      })
      .select()
      .single();

    if (historyError) {
      console.error('❌ [createTestOutingHistory] Error creating history entry:', historyError);
      throw historyError;
    }

    console.log('✅ [createTestOutingHistory] Created test outing history:', history);
    return history;
  } catch (error) {
    console.error('❌ [createTestOutingHistory] Unexpected error:', error);
    throw error;
  }
};

/**
 * Helper function to clean up test data
 */
export const cleanupTestData = async (userId: string) => {
  console.log('🧹 [cleanupTestData] Cleaning test data for user:', userId);
  
  try {
    // Get all test groups for this user
    const { data: participants } = await supabase
      .from('group_participants')
      .select('group_id, groups!inner(bar_name)')
      .eq('user_id', userId)
      .eq('groups.bar_name', 'Test Bar');

    if (participants && participants.length > 0) {
      const groupIds = participants.map(p => p.group_id);
      
      // Delete history entries
      await supabase
        .from('user_outings_history')
        .delete()
        .eq('user_id', userId)
        .eq('bar_name', 'Test Bar');

      // Delete participants
      await supabase
        .from('group_participants')
        .delete()
        .eq('user_id', userId)
        .in('group_id', groupIds);

      // Delete groups
      await supabase
        .from('groups')
        .delete()
        .in('id', groupIds);

      console.log('✅ [cleanupTestData] Cleaned up test data');
    }
  } catch (error) {
    console.error('❌ [cleanupTestData] Error during cleanup:', error);
  }
};