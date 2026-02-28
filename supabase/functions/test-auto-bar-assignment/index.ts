import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    console.log('🧪 Starting auto-bar-assignment test...');
    const steps: any[] = [];
    let testGroupId: string | null = null;
    const testUserIds: string[] = [];

    // ✅ ÉTAPE 1: Créer 5 utilisateurs de test
    console.log('👥 Creating 5 test users...');
    const timestamp = Date.now();
    
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: `test-${timestamp}-${i}@random-test.local`,
        email_confirm: true,
        user_metadata: {
          first_name: `TestUser${i}`,
          last_name: 'AutoTest',
          is_test_user: true
        },
        password: `test-${crypto.randomUUID()}`
      });
      
      if (error) throw new Error(`Failed to create user ${i}: ${error.message}`);
      testUserIds.push(data.user.id);
      console.log(`✅ User ${i+1}/5 created: ${data.user.id}`);
    }
    
    steps.push({ step: 1, name: 'Create test users', status: 'success', count: 5 });

    // ✅ ÉTAPE 2: Créer groupe test (Fort-de-France)
    console.log('🗺️ Creating test group...');
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        status: 'waiting',
        current_participants: 0,
        max_participants: 5,
        latitude: 14.6099,
        longitude: -61.0792,
        location_name: 'Fort-de-France',
        city_name: 'Fort-de-France',
        search_radius: 10000,
        created_by_user_id: testUserIds[0],
        is_test_group: true
      })
      .select()
      .single();

    if (groupError) throw new Error(`Failed to create group: ${groupError.message}`);
    testGroupId = group.id;
    console.log('✅ Test group created:', testGroupId);
    steps.push({ step: 2, name: 'Create test group', status: 'success', group_id: testGroupId });

    // ✅ ÉTAPE 3: Ajouter 5 participants
    console.log('👥 Adding 5 participants...');
    for (const userId of testUserIds) {
      const { error: partError } = await supabaseAdmin
        .from('group_participants')
        .insert({
          group_id: testGroupId,
          user_id: userId,
          status: 'confirmed',
          latitude: 14.6099,
          longitude: -61.0792,
          location_name: 'Fort-de-France'
        });
      
      if (partError) throw new Error(`Failed to add participant: ${partError.message}`);
    }
    console.log('✅ 5 participants added');
    steps.push({ step: 3, name: 'Add participants', status: 'success', count: 5 });

    // ✅ ÉTAPE 4: Passer en confirmed (trigger auto-assignment)
    console.log('🚀 Triggering auto-assignment...');
    const { error: updateError } = await supabaseAdmin
      .from('groups')
      .update({ 
        status: 'confirmed',
        current_participants: 5
      })
      .eq('id', testGroupId);

    if (updateError) throw new Error(`Failed to confirm group: ${updateError.message}`);
    steps.push({ step: 4, name: 'Confirm group', status: 'success', triggered: true });

    // ✅ ÉTAPE 5: Attendre assignment du bar (max 10s)
    console.log('⏳ Waiting for bar assignment...');
    let barAssigned = false;
    let barInfo = null;
    let waitTime = 0;

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitTime = i + 1;
      
      const { data: checkGroup } = await supabaseAdmin
        .from('groups')
        .select('bar_name, bar_address, bar_place_id, bar_latitude, bar_longitude, meeting_time')
        .eq('id', testGroupId)
        .single();

      if (checkGroup?.bar_name) {
        barInfo = checkGroup;
        barAssigned = true;
        console.log(`✅ Bar assigned after ${waitTime}s:`, checkGroup.bar_name);
        break;
      }
    }

    steps.push({ 
      step: 5, 
      name: 'Wait for bar assignment', 
      status: barAssigned ? 'success' : 'failed',
      wait_time_seconds: waitTime,
      bar_assigned: barAssigned
    });

    // ✅ ÉTAPE 6: Cleanup
    console.log('🧹 Cleaning up test data...');
    await supabaseAdmin.from('group_messages').delete().eq('group_id', testGroupId);
    await supabaseAdmin.from('group_participants').delete().eq('group_id', testGroupId);
    await supabaseAdmin.from('groups').delete().eq('id', testGroupId);
    
    for (const userId of testUserIds) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }
    
    steps.push({ step: 6, name: 'Cleanup', status: 'success' });
    console.log('✅ Cleanup completed');

    // ✅ RÉSULTAT
    return new Response(
      JSON.stringify({
        success: barAssigned,
        steps,
        bar_info: barInfo,
        wait_time_seconds: waitTime,
        test_group_id: testGroupId,
        test_users_count: testUserIds.length,
        message: barAssigned 
          ? `✅ Test passed! Bar assigned in ${waitTime}s: ${barInfo?.bar_name}`
          : `❌ Test failed: No bar assigned after ${waitTime}s`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error: any) {
    console.error('❌ Test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
