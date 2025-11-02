-- ================================================================================
-- 🚀 CRITICAL SYSTEM BOOTSTRAP - EXECUTE THIS NOW
-- ================================================================================
-- 
-- This script initializes the email and notification system.
-- Execute these commands in order in the Supabase SQL Editor.
--
-- Status: System currently NON-OPERATIONAL
-- Priority: P0 - CRITICAL
-- Estimated Time: 2 minutes
-- ================================================================================

-- ============================================================
-- STEP 1: Bootstrap Zoho OAuth Token (CRITICAL!)
-- ============================================================
-- This creates the first OAuth token in the database.
-- Without this, NO EMAILS can be sent.

SELECT net.http_post(
  url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/bootstrap-zoho-token',
  headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb
) as bootstrap_result;

-- ✅ Expected result: JSON with "success": true
-- ❌ If error: Check that ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN are set in Supabase secrets

-- Verify token was created:
SELECT 
  id, 
  expires_at,
  expires_at > NOW() as is_valid,
  consecutive_failures,
  circuit_breaker_until
FROM zoho_oauth_tokens;

-- ✅ Expected: 1 row with is_valid = true, consecutive_failures = 0


-- ============================================================
-- STEP 2: Enable Required Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ✅ Expected: "CREATE EXTENSION" or "already exists"


-- ============================================================
-- STEP 3: Create Cron Job for Campaign Queue Processing
-- ============================================================
-- This cron job processes the email queue every minute.
-- Without this, campaigns will be stuck in "sending" status forever.

SELECT cron.schedule(
  'process-campaign-queue-worker',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-campaign-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- ✅ Expected: jobid returned (e.g., 7, 8, 9...)
-- ❌ If "already exists" error: Cron job is already created (good!)

-- Verify cron job is active:
SELECT 
  jobid, 
  jobname, 
  schedule, 
  active,
  command
FROM cron.job 
WHERE jobname = 'process-campaign-queue-worker';

-- ✅ Expected: 1 row with active = true


-- ============================================================
-- STEP 4: Run System Diagnostic
-- ============================================================
-- This checks all components and gives you a health report.

SELECT net.http_post(
  url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/diagnose-system',
  headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb
) as diagnostic_result;

-- ✅ Expected: "overall_status": "🟢 HEALTHY"
-- ⚠️ If warnings: Check recommendations in the response
-- 🔴 If critical: Follow the recommendations immediately


-- ============================================================
-- STEP 5: Verify System is Operational (Optional but Recommended)
-- ============================================================

-- Check recent cron job executions:
SELECT 
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'process-campaign-queue-worker'
)
ORDER BY start_time DESC 
LIMIT 5;

-- ✅ Expected: Recent executions with status = 'succeeded'

-- Check campaign queue status:
SELECT 
  campaign_id,
  status,
  processed,
  total,
  failed,
  created_at,
  AGE(NOW(), created_at) as age
FROM campaign_email_queue 
ORDER BY created_at DESC 
LIMIT 5;

-- ✅ Expected: Empty or campaigns moving through 'pending' → 'sending' → 'completed'

-- Check for stuck queues (older than 10 minutes in 'sending'):
SELECT 
  campaign_id,
  status,
  processed,
  total,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM campaign_email_queue 
WHERE status = 'sending' 
  AND created_at < NOW() - INTERVAL '10 minutes';

-- ✅ Expected: 0 rows (no stuck queues)
-- ❌ If rows found: Check edge function logs for errors


-- ================================================================================
-- 🎉 BOOTSTRAP COMPLETE!
-- ================================================================================
-- 
-- Next Steps:
-- 1. Go to Admin CRM Dashboard (/admin/crm)
-- 2. Test email sending using the Push Test Panel
-- 3. Monitor the Queue Monitor widget for real-time status
-- 4. Create a test campaign to verify end-to-end flow
--
-- Monitoring Tools:
-- - Supabase Dashboard > Edge Functions > Logs (send-zoho-email, process-campaign-queue)
-- - Admin CRM > Queue Monitor Widget (real-time queue status)
-- - Admin CRM > System Status Widget (OAuth health and circuit breaker)
--
-- Troubleshooting:
-- - See SYSTEM_BOOTSTRAP_INSTRUCTIONS.md for detailed troubleshooting
-- - Run diagnose-system edge function for health check
-- - Check ZOHO_INTEGRATION.md for rate limit handling
--
-- ================================================================================
