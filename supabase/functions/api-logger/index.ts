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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const {
      api_name = 'google_places',
      endpoint,
      request_type,
      status_code,
      response_time_ms,
      cost_usd = 0.017, // Default Google Places Search cost
      error_message,
      metadata,
      user_id,
      group_id
    } = body

    // Log the API request to our tracking table
    const { error } = await supabase
      .from('api_requests_log')
      .insert({
        api_name,
        endpoint,
        request_type,
        status_code,
        response_time_ms,
        cost_usd,
        error_message,
        metadata,
        user_id,
        group_id
      })

    if (error) {
      console.error('Error logging API request:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'API request logged successfully' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in API logger:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})