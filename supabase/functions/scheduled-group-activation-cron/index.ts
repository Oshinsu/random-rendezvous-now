import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🕐 [CRON] Démarrage activation groupes planifiés');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the activation function
    const { data: activatedCount, error } = await supabase.rpc('activate_ready_scheduled_groups');

    if (error) {
      console.error('❌ [CRON] Erreur activation groupes:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          activatedGroups: 0
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`✅ [CRON] ${activatedCount || 0} groupes planifiés activés avec succès`);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        activatedGroups: activatedCount || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ [CRON] Erreur inattendue:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        activatedGroups: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});