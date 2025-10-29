import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Starting check-inactive-users cron job...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer tous les utilisateurs avec leur health score
    const { data: users, error: usersError } = await supabase
      .from('crm_user_health')
      .select('user_id, health_score, days_since_last_activity, days_since_signup, never_logged_in, total_logins');

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`📊 Processing ${users?.length || 0} users for inactivity and health checks...`);

    let triggeredCount = 0;
    const results: any[] = [];

    for (const user of users || []) {
      const triggers: string[] = [];

      // ✅ RÈGLE INACTIVITY - 2 jours (Golden 48h - Activation Critique)
      if (user.days_since_last_activity >= 2 && user.days_since_last_activity < 3) {
        triggers.push('inactivity_2d');
        
        const { error: invokeError } = await supabase.functions.invoke('lifecycle-automations', {
          body: {
            userId: user.user_id,
            triggerType: 'inactivity',
            daysInactive: user.days_since_last_activity,
            daysInactiveExact: 2,
            neverLoggedIn: user.never_logged_in,
            source: 'check-inactive-users-cron'
          }
        });

        if (invokeError) {
          console.error(`❌ Error invoking lifecycle-automations for user ${user.user_id}:`, invokeError);
        } else {
          triggeredCount++;
        }
      }

      // ✅ RÈGLE INACTIVITY - 7 jours (Win-Back Intelligent J7)
      if (user.days_since_last_activity >= 7 && user.days_since_last_activity < 8) {
        triggers.push('inactivity_7d');
        
        const { error: invokeError } = await supabase.functions.invoke('lifecycle-automations', {
          body: {
            userId: user.user_id,
            triggerType: 'inactivity',
            daysInactive: user.days_since_last_activity,
            daysInactiveExact: 7,
            totalLogins: user.total_logins,
            source: 'check-inactive-users-cron'
          }
        });

        if (invokeError) {
          console.error(`❌ Error invoking lifecycle-automations for user ${user.user_id}:`, invokeError);
        } else {
          triggeredCount++;
        }
      }

      // ✅ RÈGLE INACTIVITY - 14 jours (Churn Prevention - Last Chance)
      if (user.days_since_last_activity >= 14 && user.days_since_last_activity < 15) {
        triggers.push('inactivity_14d');
        
        const { error: invokeError } = await supabase.functions.invoke('lifecycle-automations', {
          body: {
            userId: user.user_id,
            triggerType: 'inactivity',
            daysInactive: user.days_since_last_activity,
            daysInactiveExact: 14,
            totalLogins: user.total_logins,
            source: 'check-inactive-users-cron'
          }
        });

        if (invokeError) {
          console.error(`❌ Error invoking lifecycle-automations for user ${user.user_id}:`, invokeError);
        } else {
          triggeredCount++;
        }
      }

      // ✅ RÈGLE HEALTH_THRESHOLD - Score < 30 (at_risk_churn)
      if (user.health_score < 30) {
        triggers.push('health_low');
        
        const { error: invokeError } = await supabase.functions.invoke('lifecycle-automations', {
          body: {
            userId: user.user_id,
            triggerType: 'health_threshold',
            healthScore: user.health_score,
            threshold: 30,
            source: 'check-inactive-users-cron'
          }
        });

        if (invokeError) {
          console.error(`❌ Error invoking lifecycle-automations for user ${user.user_id}:`, invokeError);
        } else {
          triggeredCount++;
        }
      }

      if (triggers.length > 0) {
        results.push({
          userId: user.user_id,
          triggers,
          healthScore: user.health_score,
          daysInactive: user.days_since_last_activity
        });
      }
    }

    console.log(`✅ Check complete: ${triggeredCount} automations triggered for ${results.length} users`);

    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: users?.length || 0,
        triggeredAutomations: triggeredCount,
        triggeredUsers: results.length,
        details: results.slice(0, 10) // Limit to first 10 for logging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in check-inactive-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});