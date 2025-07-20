
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🔥 [GROUP-PARTICIPANT-TRIGGER] Déclenchement attribution automatique de bar')

    // Rechercher les messages de déclenchement non traités
    const { data: triggerMessages, error: fetchError } = await supabase
      .from('group_messages')
      .select('group_id, created_at')
      .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER')
      .eq('is_system', true)
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('❌ Erreur récupération messages trigger:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur récupération messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!triggerMessages || triggerMessages.length === 0) {
      console.log('ℹ️ Aucun message de déclenchement en attente')
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Messages de déclenchement trouvés: ${triggerMessages.length}`)

    let processedCount = 0
    let successCount = 0

    for (const trigger of triggerMessages) {
      try {
        console.log(`🎯 Traitement groupe: ${trigger.group_id}`)

        // Vérifier l'éligibilité du groupe
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('id, current_participants, status, bar_name, latitude, longitude')
          .eq('id', trigger.group_id)
          .single()

        if (groupError || !group) {
          console.log(`❌ Groupe ${trigger.group_id} introuvable`)
          continue
        }

        // Vérifier si le groupe est éligible pour l'attribution
        if (group.current_participants !== 5 || group.status !== 'confirmed' || group.bar_name) {
          console.log(`ℹ️ Groupe ${trigger.group_id} non éligible:`, {
            participants: group.current_participants,
            status: group.status,
            hasBar: !!group.bar_name
          })
          
          // Supprimer le message de déclenchement obsolète
          await supabase
            .from('group_messages')
            .delete()
            .eq('group_id', trigger.group_id)
            .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER')
            .eq('is_system', true)
          
          processedCount++
          continue
        }

        // Appeler l'attribution automatique via simple-auto-assign-bar
        console.log(`🍺 Attribution automatique pour groupe: ${trigger.group_id}`)
        
        const { data: barResult, error: barError } = await supabase.functions.invoke('simple-auto-assign-bar', {
          body: {
            group_id: trigger.group_id,
            latitude: group.latitude || 48.8566,
            longitude: group.longitude || 2.3522
          }
        })

        if (barError || !barResult?.success) {
          console.error(`❌ Erreur attribution bar pour ${trigger.group_id}:`, barError)
          
          // Envoyer message d'erreur au groupe
          await supabase
            .from('group_messages')
            .insert({
              group_id: trigger.group_id,
              user_id: '00000000-0000-0000-0000-000000000000',
              message: '⚠️ Erreur lors de l\'attribution automatique du bar. Veuillez réessayer manuellement.',
              is_system: true
            })
        } else {
          console.log(`✅ Bar assigné avec succès pour groupe: ${trigger.group_id}`)
          successCount++
        }

        // Supprimer le message de déclenchement traité
        await supabase
          .from('group_messages')
          .delete()
          .eq('group_id', trigger.group_id)
          .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER')
          .eq('is_system', true)

        processedCount++

      } catch (error) {
        console.error(`❌ Erreur traitement groupe ${trigger.group_id}:`, error)
        processedCount++
      }
    }

    console.log(`✅ Traitement terminé: ${processedCount} traités, ${successCount} succès`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        successful: successCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur globale:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
