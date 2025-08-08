import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, group_id, user_name } = await req.json().catch(() => ({}))

    if (!group_id || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action or group_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let message = ''
    if (action === 'welcome') {
      message = "🎉 Bienvenue dans votre nouveau groupe Random ! Présentez-vous et préparez cette aventure ensemble."
    } else if (action === 'join') {
      message = user_name ? `${user_name} a rejoint le groupe !` : 'Un nouvel aventurier a rejoint le groupe !'
    } else if (action === 'leave') {
      message = user_name ? `${user_name} a quitté le groupe.` : 'Un aventurier a quitté le groupe.'
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase.from('group_messages').insert({
      group_id,
      user_id: '00000000-0000-0000-0000-000000000000',
      message,
      is_system: true,
    })

    if (error) {
      console.error('❌ [system-messaging] Insert error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('❌ [system-messaging] Unexpected error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
