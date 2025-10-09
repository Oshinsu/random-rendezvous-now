import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting health score calculation for all users...');

    // Get all user IDs
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;

    console.log(`Found ${users?.length || 0} users to process`);

    let processed = 0;
    let errors = 0;

    // Calculate health score for each user
    for (const user of users || []) {
      try {
        console.log(`Processing user ${user.id}...`);
        
        const { data: healthData, error: healthError } = await supabaseClient.rpc('calculate_user_health_score', {
          target_user_id: user.id
        });

        if (healthError) {
          console.error(`Error calculating health for user ${user.id}:`, healthError);
          errors++;
        } else {
          console.log(`Health score calculated for user ${user.id}: ${healthData}`);
          
          // Also assign segments (this calls the SQL function)
          const { error: segmentError } = await supabaseClient.rpc('assign_user_segments', {
            target_user_id: user.id
          });
          
          if (segmentError) {
            console.error(`Error assigning segments for user ${user.id}:`, segmentError);
          }
          
          processed++;
        }
      } catch (err) {
        console.error(`Failed for user ${user.id}:`, err);
        errors++;
      }
    }
    
    console.log(`Finished processing. Processed: ${processed}, Errors: ${errors}`);

    console.log(`Health calculation complete: ${processed} users processed, ${errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: users?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in calculate-all-health-scores:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
