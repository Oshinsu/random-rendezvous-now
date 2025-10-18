import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🧪 [TEST] Démarrage test système auto-assignment complet...')
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const testStartTime = Date.now()
    const testUserId = '00000000-0000-0000-0000-000000000001'

    // ÉTAPE 1: Créer groupe test
    console.log('📝 [TEST] Création du groupe test...')
    const { data: newGroup, error: createError } = await supabaseAdmin
      .from('groups')
      .insert({
        status: 'waiting',
        current_participants: 5,
        max_participants: 5,
        latitude: 48.8566,
        longitude: 2.3522,
        location_name: 'Paris Test Location',
        created_by_user_id: testUserId,
        search_radius: 25000
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ [TEST] Erreur création groupe:', createError)
      throw createError
    }
    console.log('✅ [TEST] Groupe créé:', newGroup.id)

    // ÉTAPE 2: Ajouter 5 participants confirmés
    console.log('👥 [TEST] Ajout de 5 participants...')
    const participants = Array.from({ length: 5 }, (_, i) => ({
      group_id: newGroup.id,
      user_id: testUserId,
      status: 'confirmed',
      joined_at: new Date().toISOString(),
      latitude: 48.8566,
      longitude: 2.3522,
      location_name: 'Paris Test'
    }))

    const { error: participantsError } = await supabaseAdmin
      .from('group_participants')
      .insert(participants)

    if (participantsError) {
      console.error('❌ [TEST] Erreur ajout participants:', participantsError)
      throw participantsError
    }
    console.log('✅ [TEST] 5 participants ajoutés')

    // ÉTAPE 3: Passer en confirmed (DÉCLENCHE LE TRIGGER)
    console.log('🚀 [TEST] Passage en confirmed (trigger attendu)...')
    const { error: updateError } = await supabaseAdmin
      .from('groups')
      .update({ 
        status: 'confirmed',
        current_participants: 5 
      })
      .eq('id', newGroup.id)

    if (updateError) {
      console.error('❌ [TEST] Erreur update status:', updateError)
      throw updateError
    }
    console.log('✅ [TEST] Groupe passé en confirmed')

    // ÉTAPE 4: Vérifier trigger message (attendre 2s)
    console.log('⏳ [TEST] Attente création trigger message...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: triggerMessages, error: messagesError } = await supabaseAdmin
      .from('group_messages')
      .select('*')
      .eq('group_id', newGroup.id)
      .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER')
      .eq('is_system', true)

    if (messagesError) {
      console.error('❌ [TEST] Erreur lecture messages:', messagesError)
    }

    const triggerCreated = triggerMessages && triggerMessages.length > 0
    console.log(triggerCreated ? '✅ [TEST] Trigger message créé' : '❌ [TEST] Pas de trigger message')

    // ÉTAPE 5: Attendre assignment du bar (max 8s)
    console.log('⏳ [TEST] Attente assignment bar (max 8s)...')
    let barAssigned = false
    let updatedGroup = null

    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: checkGroup } = await supabaseAdmin
        .from('groups')
        .select('bar_name, bar_address, bar_place_id, bar_latitude, bar_longitude')
        .eq('id', newGroup.id)
        .single()

      if (checkGroup?.bar_name) {
        updatedGroup = checkGroup
        barAssigned = true
        console.log(`✅ [TEST] Bar assigné après ${i + 1}s:`, checkGroup.bar_name)
        break
      }
    }

    if (!barAssigned) {
      console.error('❌ [TEST] Timeout: Pas de bar assigné après 8s')
    }

    // ÉTAPE 6: Cleanup complet
    console.log('🧹 [TEST] Cleanup...')
    await supabaseAdmin.from('group_messages').delete().eq('group_id', newGroup.id)
    await supabaseAdmin.from('group_participants').delete().eq('group_id', newGroup.id)
    await supabaseAdmin.from('groups').delete().eq('id', newGroup.id)
    console.log('✅ [TEST] Cleanup terminé')

    const testDuration = Date.now() - testStartTime

    // RÉSULTAT FINAL
    const result = {
      success: triggerCreated && barAssigned,
      test_group_id: newGroup.id,
      test_duration_ms: testDuration,
      steps: {
        group_created: true,
        participants_added: true,
        status_updated: true,
        trigger_message_created: triggerCreated,
        bar_assigned: barAssigned
      },
      bar_info: barAssigned ? {
        name: updatedGroup.bar_name,
        address: updatedGroup.bar_address,
        place_id: updatedGroup.bar_place_id,
        latitude: updatedGroup.bar_latitude,
        longitude: updatedGroup.bar_longitude
      } : null,
      status: triggerCreated && barAssigned ? 'PASSED' : 'FAILED',
      message: triggerCreated && barAssigned 
        ? '✅ Système auto-assignment 100% fonctionnel' 
        : `❌ Échec: trigger=${triggerCreated}, bar=${barAssigned}`
    }

    console.log('📊 [TEST] Résultat final:', result)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )

  } catch (error) {
    console.error('❌ [TEST] Erreur globale:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'ERROR',
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
