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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    console.log('🧪 Début du test d\'assignation de bar');

    const steps = [];
    const timestamp = Date.now();

    // ÉTAPE 1: Créer 5 utilisateurs de test
    console.log('👥 Création de 5 utilisateurs de test...');
    const startStep1 = Date.now();
    const testUsers = [];
    
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
      
      if (error) throw new Error(`Erreur création user ${i}: ${error.message}`);
      testUsers.push(data.user);
      console.log(`✅ User ${i+1}/5 créé: ${data.user.id}`);
    }
    
    steps.push({
      name: "Création de 5 utilisateurs test",
      status: "success",
      duration: Date.now() - startStep1,
      details: `5 utilisateurs créés`
    });

    // ÉTAPE 2: Créer groupe test
    console.log('🗺️ Création du groupe test...');
    const startStep2 = Date.now();
    
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .insert({
        status: 'waiting',
        current_participants: 0,
        max_participants: 5,
        latitude: 14.6037,
        longitude: -61.0731,
        location_name: 'Fort-de-France',
        city_name: 'Fort-de-France',
        search_radius: 10000,
        created_by_user_id: testUsers[0].id,
        is_test_group: true
      })
      .select()
      .single();

    if (groupError) throw new Error(`Erreur création groupe: ${groupError.message}`);
    console.log(`✅ Groupe créé: ${group.id}`);
    
    steps.push({
      name: "Création du groupe test",
      status: "success",
      duration: Date.now() - startStep2,
      details: `Groupe: ${group.id}`
    });

    // ÉTAPE 3: Ajouter 5 participants
    console.log('👥 Ajout des 5 participants...');
    const startStep3 = Date.now();
    
    for (const user of testUsers) {
      const { error: partError } = await supabaseAdmin
        .from('group_participants')
        .insert({
          group_id: group.id,
          user_id: user.id,
          status: 'confirmed',
          latitude: 14.6037 + (Math.random() - 0.5) * 0.01,
          longitude: -61.0731 + (Math.random() - 0.5) * 0.01,
          location_name: 'Fort-de-France'
        });
      
      if (partError) throw new Error(`Erreur ajout participant: ${partError.message}`);
    }
    console.log('✅ 5 participants ajoutés');
    
    steps.push({
      name: "Ajout de 5 participants",
      status: "success",
      duration: Date.now() - startStep3,
      details: "5 participants confirmés"
    });

    // ÉTAPE 4: Attendre confirmation automatique (max 10s)
    console.log('⏳ Attente confirmation automatique...');
    const startStep4 = Date.now();
    let groupConfirmed = false;
    let attempts = 0;

    while (attempts < 20 && !groupConfirmed) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: updatedGroup } = await supabaseAdmin
        .from('groups')
        .select('status')
        .eq('id', group.id)
        .single();
      
      if (updatedGroup?.status === 'confirmed') {
        groupConfirmed = true;
        console.log(`✅ Groupe confirmé après ${attempts * 500}ms`);
      }
      
      attempts++;
    }

    if (!groupConfirmed) {
      throw new Error('Le groupe n\'a pas été confirmé automatiquement après 10s');
    }
    
    steps.push({
      name: "Confirmation automatique",
      status: "success",
      duration: Date.now() - startStep4,
      details: `Confirmé automatiquement via trigger`
    });

    // ÉTAPE 5: Attendre assignment du bar (max 15s)
    console.log('⏳ Attente assignment bar...');
    const startStep5 = Date.now();
    let barAssigned = false;
    let barInfo = null;
    let barAttempts = 0;

    while (barAttempts < 30 && !barAssigned) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: checkGroup } = await supabaseAdmin
        .from('groups')
        .select('bar_name, bar_address, bar_place_id, bar_latitude, bar_longitude, meeting_time')
        .eq('id', group.id)
        .single();

      if (checkGroup?.bar_name) {
        barInfo = checkGroup;
        barAssigned = true;
        console.log(`✅ Bar assigné: ${checkGroup.bar_name}`);
      }
      
      barAttempts++;
    }
    
    steps.push({
      name: "Vérification bar assigné",
      status: barAssigned ? "success" : "error",
      duration: Date.now() - startStep5,
      details: barAssigned ? `Bar: ${barInfo.bar_name}` : "Aucun bar assigné après 15s"
    });

    // ÉTAPE 6: Vérification finale
    const startStep6 = Date.now();
    const isValid = barInfo && 
      barInfo.bar_name && 
      barInfo.bar_address && 
      barInfo.bar_latitude && 
      barInfo.bar_longitude && 
      barInfo.bar_place_id && 
      barInfo.meeting_time;
    
    steps.push({
      name: "Vérification données complètes",
      status: isValid ? "success" : "error",
      duration: Date.now() - startStep6,
      details: isValid ? "Toutes les données présentes" : "Données manquantes"
    });

    // CLEANUP AUTOMATIQUE
    console.log('🧹 Cleanup automatique...');
    
    await supabaseAdmin.from('group_messages').delete().eq('group_id', group.id);
    await supabaseAdmin.from('group_participants').delete().eq('group_id', group.id);
    await supabaseAdmin.from('groups').delete().eq('id', group.id);
    
    for (const user of testUsers) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
    
    console.log('✅ Cleanup terminé');

    // RÉSULTAT
    return new Response(
      JSON.stringify({
        success: barAssigned && isValid,
        steps: steps,
        barInfo: barInfo,
        testGroupId: group.id,
        testUsersIds: testUsers.map(u => u.id),
        totalDuration: steps.reduce((acc, s) => acc + s.duration, 0),
        message: barAssigned && isValid
          ? `✅ Test réussi ! Bar trouvé: ${barInfo.bar_name}`
          : `❌ Test échoué`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error: any) {
    console.error('❌ Erreur test:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        steps: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
