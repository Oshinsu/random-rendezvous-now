import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Edge Function de cleanup automatique
 * Source: Database Maintenance Best Practices 2025
 * 
 * Nettoie:
 * - bar_assignment_log (>30 jours)
 * - bar_status_cache (expirés)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🧹 [CLEANUP] Début du nettoyage automatique...')

    // Cleanup 1: bar_assignment_log (>30 jours)
    const { data: assignmentCleanup, error: assignmentError } = await supabase
      .rpc('cleanup_old_bar_assignments')

    if (assignmentError) {
      console.error('❌ [CLEANUP] Erreur cleanup assignments:', assignmentError)
    } else {
      console.log(`✅ [CLEANUP] ${assignmentCleanup} assignments supprimés (>30j)`)
    }

    // Cleanup 2: bar_status_cache (expirés)
    const { data: cacheCleanup, error: cacheError } = await supabase
      .rpc('cleanup_expired_bar_cache')

    if (cacheError) {
      console.error('❌ [CLEANUP] Erreur cleanup cache:', cacheError)
    } else {
      console.log(`✅ [CLEANUP] ${cacheCleanup} entrées cache supprimées (expirées)`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        assignments_cleaned: assignmentCleanup || 0,
        cache_cleaned: cacheCleanup || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('❌ [CLEANUP] Erreur globale:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error instanceof Error ? error.message : String(error)) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})