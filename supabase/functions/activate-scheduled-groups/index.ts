import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting scheduled groups activation check...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    console.log(`⏰ Current time: ${now.toISOString()}`);

    // Find scheduled groups that should be activated (scheduled time has arrived)
    const { data: groupsToActivate, error: fetchError } = await supabase
      .from('groups')
      .select('id, scheduled_for, location_name, current_participants')
      .eq('is_scheduled', true)
      .eq('status', 'waiting')
      .lte('scheduled_for', now.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching groups to activate:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch groups', details: fetchError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!groupsToActivate || groupsToActivate.length === 0) {
      console.log('ℹ️ No groups ready for activation');
      return new Response(
        JSON.stringify({ 
          message: 'No groups to activate', 
          activatedCount: 0,
          timestamp: now.toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`📋 Found ${groupsToActivate.length} groups to activate:`, 
      groupsToActivate.map(g => ({ 
        id: g.id, 
        scheduled_for: g.scheduled_for, 
        participants: g.current_participants 
      }))
    );

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
      console.error('❌ Error activating groups:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to activate groups', details: updateError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send activation messages to each group
    const messagePromises = groupIds.map(async (groupId) => {
      const { error: messageError } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000',
          message: '🎯 Votre groupe planifié est maintenant actif ! La recherche de bar va commencer.',
          is_system: true
        });

      if (messageError) {
        console.error(`❌ Error sending activation message to group ${groupId}:`, messageError);
      } else {
        console.log(`✅ Activation message sent to group ${groupId}`);
      }

      return messageError;
    });

    // Wait for all messages to be sent
    const messageResults = await Promise.all(messagePromises);
    const messageErrors = messageResults.filter(err => err !== null);

    console.log(`✅ Successfully activated ${groupsToActivate.length} groups`);
    
    if (messageErrors.length > 0) {
      console.warn(`⚠️ ${messageErrors.length} message sending errors occurred`);
    }

    // Check for groups that became full and need bar assignment
    for (const group of groupsToActivate) {
      if (group.current_participants === 5) {
        console.log(`🏆 Group ${group.id} is full, updating status to confirmed`);
        
        const { error: statusError } = await supabase
          .from('groups')
          .update({ status: 'confirmed' })
          .eq('id', group.id);

        if (statusError) {
          console.error(`❌ Error updating group ${group.id} to confirmed:`, statusError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        activatedCount: groupsToActivate.length,
        messageErrors: messageErrors.length,
        activatedGroups: groupsToActivate.map(g => ({
          id: g.id,
          scheduledFor: g.scheduled_for,
          participants: g.current_participants
        })),
        timestamp: now.toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Unexpected error in activate-scheduled-groups:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});