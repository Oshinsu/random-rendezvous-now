import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * 🔍 System Diagnostic Tool
 * 
 * Comprehensive health check for email and notification infrastructure
 * SOTA Oct 2025 best practices
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Starting system diagnostic...');

    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      checks: {} as any,
      recommendations: [] as string[]
    };

    // ===== CHECK 1: Zoho OAuth Token =====
    console.log('🔑 Checking Zoho OAuth token...');
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('zoho_oauth_tokens')
      .select('*')
      .maybeSingle();

    if (tokenError) {
      diagnosticResults.checks.zoho_token = {
        status: 'error',
        error: tokenError.message
      };
    } else if (!tokenData) {
      diagnosticResults.checks.zoho_token = {
        status: 'critical',
        message: '❌ No Zoho token found in database',
        impact: 'Email sending is completely blocked'
      };
      diagnosticResults.recommendations.push(
        '🚨 CRITICAL: Run bootstrap-zoho-token function immediately'
      );
    } else {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      const isExpired = expiresAt <= now;
      const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);
      
      const circuitBreakerActive = tokenData.circuit_breaker_until && 
        new Date(tokenData.circuit_breaker_until) > now;

      diagnosticResults.checks.zoho_token = {
        status: isExpired ? 'critical' : (circuitBreakerActive ? 'warning' : 'healthy'),
        token_id: tokenData.id,
        expires_at: tokenData.expires_at,
        is_expired: isExpired,
        minutes_until_expiry: minutesUntilExpiry,
        consecutive_failures: tokenData.consecutive_failures,
        circuit_breaker_active: circuitBreakerActive,
        circuit_breaker_until: tokenData.circuit_breaker_until
      };

      if (isExpired) {
        diagnosticResults.recommendations.push(
          '⚠️ Token expired - will auto-refresh on next email send'
        );
      }
      if (circuitBreakerActive) {
        diagnosticResults.recommendations.push(
          `🔴 Circuit breaker active until ${tokenData.circuit_breaker_until} - Rate limit hit`
        );
      }
      if (tokenData.consecutive_failures > 0) {
        diagnosticResults.recommendations.push(
          `⚠️ ${tokenData.consecutive_failures} consecutive OAuth failures detected`
        );
      }
    }

    // ===== CHECK 2: Campaign Email Queue =====
    console.log('📬 Checking campaign queue...');
    const { data: queueData, error: queueError } = await supabaseClient
      .from('campaign_email_queue')
      .select('status, processed, total, failed, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (queueError) {
      diagnosticResults.checks.campaign_queue = {
        status: 'error',
        error: queueError.message
      };
    } else {
      const pendingQueues = queueData?.filter(q => q.status === 'pending') || [];
      const sendingQueues = queueData?.filter(q => q.status === 'sending') || [];
      const stuckQueues = sendingQueues.filter(q => {
        const ageMinutes = (Date.now() - new Date(q.created_at).getTime()) / 60000;
        return ageMinutes > 10; // Stuck if sending for >10 minutes
      });

      diagnosticResults.checks.campaign_queue = {
        status: stuckQueues.length > 0 ? 'warning' : 'healthy',
        total_queues: queueData?.length || 0,
        pending: pendingQueues.length,
        sending: sendingQueues.length,
        stuck: stuckQueues.length,
        recent_queues: queueData?.map(q => ({
          status: q.status,
          progress: `${q.processed}/${q.total}`,
          failed: q.failed,
          age_minutes: Math.floor((Date.now() - new Date(q.created_at).getTime()) / 60000)
        }))
      };

      if (stuckQueues.length > 0) {
        diagnosticResults.recommendations.push(
          `⚠️ ${stuckQueues.length} queues stuck in 'sending' state - Check cron job`
        );
      }
    }

    // ===== CHECK 3: Recent Campaigns =====
    console.log('📊 Checking recent campaigns...');
    const { data: campaignsData, error: campaignsError } = await supabaseClient
      .from('crm_campaigns')
      .select('id, campaign_name, status, channels, created_at, send_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (campaignsError) {
      diagnosticResults.checks.campaigns = {
        status: 'error',
        error: campaignsError.message
      };
    } else {
      diagnosticResults.checks.campaigns = {
        status: 'healthy',
        total: campaignsData?.length || 0,
        recent: campaignsData?.map(c => ({
          name: c.campaign_name,
          status: c.status,
          channels: c.channels,
          send_at: c.send_at
        }))
      };
    }

    // ===== CHECK 4: User Profile Completeness =====
    console.log('👥 Checking user profiles...');
    const { data: profileStats, error: profileError } = await supabaseClient
      .rpc('get_profile_stats');

    if (!profileError && profileStats) {
      diagnosticResults.checks.user_profiles = {
        status: 'healthy',
        ...profileStats
      };
    } else {
      // Fallback manual count
      const { count: totalUsers } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: usersWithEmail } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('email', 'is', null);

      diagnosticResults.checks.user_profiles = {
        status: 'healthy',
        total_users: totalUsers || 0,
        users_with_email: usersWithEmail || 0,
        email_coverage: totalUsers ? Math.round((usersWithEmail! / totalUsers) * 100) : 0
      };
    }

    // ===== CHECK 5: Environment Variables =====
    console.log('🔐 Checking environment variables...');
    const requiredEnvVars = [
      'ZOHO_CLIENT_ID',
      'ZOHO_CLIENT_SECRET',
      'ZOHO_REFRESH_TOKEN',
      'ZOHO_ACCOUNT_ID',
      'FIREBASE_PROJECT_ID'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));

    diagnosticResults.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'critical',
      required_vars: requiredEnvVars.length,
      missing_vars: missingEnvVars
    };

    if (missingEnvVars.length > 0) {
      diagnosticResults.recommendations.push(
        `🚨 Missing environment variables: ${missingEnvVars.join(', ')}`
      );
    }

    // ===== DETERMINE OVERALL STATUS =====
    const criticalIssues = Object.values(diagnosticResults.checks)
      .filter((check: any) => check.status === 'critical').length;
    const warnings = Object.values(diagnosticResults.checks)
      .filter((check: any) => check.status === 'warning').length;

    if (criticalIssues > 0) {
      diagnosticResults.overall_status = '🔴 CRITICAL';
    } else if (warnings > 0) {
      diagnosticResults.overall_status = '🟡 WARNING';
    } else {
      diagnosticResults.overall_status = '🟢 HEALTHY';
    }

    // ===== SUMMARY RECOMMENDATIONS =====
    if (diagnosticResults.recommendations.length === 0) {
      diagnosticResults.recommendations.push('✅ All systems operational');
    }

    console.log('✅ Diagnostic complete');
    console.log(`Overall status: ${diagnosticResults.overall_status}`);

    return new Response(
      JSON.stringify(diagnosticResults, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return new Response(
      JSON.stringify({
        error: (error instanceof Error ? error.message : String(error)),
        overall_status: '🔴 DIAGNOSTIC FAILURE'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
