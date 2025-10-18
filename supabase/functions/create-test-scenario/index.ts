import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario_type, location, cleanup_after } = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    console.log(`🌍 Test Scenario: ${scenario_type} à ${location.city_name}`);

    // ✅ ÉTAPE 1: Créer 5 utilisateurs de test
    console.log('👥 Création de 5 utilisateurs de test...');
    const testUsers = [];
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
      
      if (error) {
        console.error(`❌ Erreur création user ${i}:`, error);
        throw error;
      }
      testUsers.push(data.user);
      console.log(`✅ User ${i+1}/5 créé:`, data.user.id);
    }

    // ✅ ÉTAPE 2: Créer groupe avec coordonnées custom
    console.log('🗺️ Création groupe test avec coordonnées:', location);
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        status: 'waiting',
        current_participants: 0,
        max_participants: 5,
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.city_name,
        city_name: location.city_name,
        search_radius: location.search_radius,
        created_by_user_id: testUsers[0].id,
        is_test_group: true
      })
      .select()
      .single();

    if (groupError) {
      console.error('❌ Erreur création groupe:', groupError);
      throw groupError;
    }
    console.log('✅ Groupe créé:', group.id);

    // ✅ ÉTAPE 3: Ajouter 5 participants
    console.log('👥 Ajout des 5 participants...');
    for (const user of testUsers) {
      const { error: partError } = await supabaseAdmin
        .from('group_participants')
        .insert({
          group_id: group.id,
          user_id: user.id,
          status: 'confirmed',
          latitude: location.latitude,
          longitude: location.longitude,
          location_name: location.city_name
        });
      
      if (partError) {
        console.error('❌ Erreur ajout participant:', partError);
        throw partError;
      }
    }
    console.log('✅ 5 participants ajoutés');

    // ✅ ÉTAPE 4: Passer en confirmed (trigger auto-assignment)
    console.log('🚀 Passage en confirmed → trigger auto-assignment');
    const { error: updateError } = await supabaseAdmin
      .from('groups')
      .update({ 
        status: 'confirmed',
        current_participants: 5
      })
      .eq('id', group.id);

    if (updateError) {
      console.error('❌ Erreur update status:', updateError);
      throw updateError;
    }

    // ✅ ÉTAPE 5: Attendre assignment du bar (max 10s)
    console.log('⏳ Attente assignment bar...');
    let barAssigned = false;
    let barInfo = null;
    let waitTime = 0;

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitTime = i + 1;
      
      const { data: checkGroup } = await supabaseAdmin
        .from('groups')
        .select('bar_name, bar_address, bar_place_id, bar_latitude, bar_longitude, meeting_time')
        .eq('id', group.id)
        .single();

      if (checkGroup?.bar_name) {
        barInfo = checkGroup;
        barAssigned = true;
        console.log(`✅ Bar assigné après ${waitTime}s:`, checkGroup.bar_name);
        break;
      }
    }

    // ✅ ÉTAPE 6: Cleanup (si demandé)
    if (cleanup_after) {
      console.log('🧹 Cleanup automatique...');
      
      // Supprimer messages
      await supabaseAdmin.from('group_messages').delete().eq('group_id', group.id);
      
      // Supprimer participants
      await supabaseAdmin.from('group_participants').delete().eq('group_id', group.id);
      
      // Supprimer groupe
      await supabaseAdmin.from('groups').delete().eq('id', group.id);
      
      // Supprimer users de test
      for (const user of testUsers) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
      
      console.log('✅ Cleanup terminé');
    }

    // ✅ RÉSULTAT
    return new Response(
      JSON.stringify({
        success: barAssigned,
        test_group_id: group.id,
        test_users_ids: testUsers.map(u => u.id),
        location: location,
        bar_info: barInfo,
        wait_time_seconds: waitTime,
        cleanup_performed: cleanup_after,
        message: barAssigned 
          ? `✅ Test réussi ! Bar trouvé en ${waitTime}s: ${barInfo.bar_name}`
          : `❌ Timeout: Aucun bar assigné après ${waitTime}s à ${location.city_name}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error: any) {
    console.error('❌ Erreur test scenario:', error);
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
