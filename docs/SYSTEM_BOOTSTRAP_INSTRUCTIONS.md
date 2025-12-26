# 🚀 System Bootstrap Instructions - CRITICAL

## Current Status: ⚠️ SYSTEM BLOCKED

The email and notification system is currently **non-operational** due to missing initialization.

## Root Cause
The `zoho_oauth_tokens` table is **empty**, preventing all email campaigns from being sent.

## Immediate Actions Required (Execute in Order)

### Phase 1: Bootstrap Zoho Token (CRITICAL - Do This First!)

```sql
-- Step 1: Call the bootstrap function to initialize the first token
SELECT net.http_post(
  url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/bootstrap-zoho-token',
  headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb
);

-- Step 2: Verify the token was created
SELECT id, expires_at, consecutive_failures, circuit_breaker_until 
FROM zoho_oauth_tokens;

-- Expected result: One row with expires_at ~59 minutes in the future
```

### Phase 2: Enable Cron Job for Campaign Queue Processing

```sql
-- Enable pg_cron and pg_net extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job to process campaign queue every minute
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

-- Verify cron job was created
SELECT jobid, jobname, schedule, active FROM cron.job 
WHERE jobname = 'process-campaign-queue-worker';
```

### Phase 3: Test the System

```sql
-- 1. Test Zoho email sending manually (use Admin CRM > Push Test Panel)
-- 2. Create a test campaign
-- 3. Monitor logs:

-- Check edge function logs in Supabase Dashboard:
-- - send-zoho-email
-- - process-campaign-queue
-- - send-lifecycle-campaign

-- Check queue status:
SELECT campaign_id, status, processed, total, failed, created_at 
FROM campaign_email_queue 
ORDER BY created_at DESC 
LIMIT 5;

-- Check OAuth token health:
SELECT 
  id, 
  expires_at,
  expires_at > NOW() as is_valid,
  consecutive_failures,
  circuit_breaker_until,
  circuit_breaker_until > NOW() as circuit_breaker_active
FROM zoho_oauth_tokens;
```

## Expected System Behavior After Bootstrap

### ✅ Healthy System Indicators

1. **Token Table**: 1 row with `expires_at` > NOW()
2. **Circuit Breaker**: `circuit_breaker_until` IS NULL
3. **Consecutive Failures**: 0
4. **Cron Job**: Active and running every minute
5. **Queue Processing**: Campaigns move from 'pending' → 'sending' → 'completed'

### ⚠️ Warning Signs

- `consecutive_failures` > 0: Zoho API issues detected
- `circuit_breaker_until` IS NOT NULL: Rate limit hit, system paused
- Queue stuck in 'sending': Cron job not running or failing

### 🚨 Critical Issues

- No rows in `zoho_oauth_tokens`: System cannot send emails
- `circuit_breaker_until` > NOW() + 1 hour: Severe rate limiting, wait required
- Cron job `active = false`: Queue processing disabled

## Monitoring Dashboard

Use the CRM Admin Dashboard:
- **Queue Monitor Widget**: Real-time campaign queue status
- **System Status Widget**: OAuth health and circuit breaker state
- **Push Test Panel**: Manual email testing

## Rate Limits (SOTA Oct 2025)

| Limit Type | Value | Mitigation |
|------------|-------|------------|
| OAuth Calls | 10/minute | PostgreSQL cache (99%+ hit rate) |
| Email Sends (Free) | 100/hour | Queue system (5 emails/min) |
| Email Sends (Pro) | 5000/day | Same queue system |

## Troubleshooting

### Issue: "Access Denied" from Zoho
**Cause**: Rate limit hit  
**Solution**: Circuit breaker auto-activates. Wait 5-60 minutes, then reactivate in CRM widget.

### Issue: Token expires_at in the past
**Cause**: Token refresh failed  
**Solution**: Delete old token, re-run `bootstrap-zoho-token` function.

```sql
-- Clear expired token
DELETE FROM zoho_oauth_tokens WHERE expires_at < NOW();

-- Re-bootstrap
SELECT net.http_post(...); -- Use bootstrap call from Phase 1
```

### Issue: Queue stuck at 'sending'
**Cause**: Cron job not running or edge function errors  
**Solution**: Check cron job status and edge function logs.

```sql
-- Check last cron executions
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-campaign-queue-worker')
ORDER BY start_time DESC 
LIMIT 10;

-- If no recent runs, recreate cron job (see Phase 2)
```

## References

- **ZOHO_INTEGRATION.md**: Complete Zoho Mail integration documentation
- **Supabase Edge Function Logs**: Real-time debugging
- **CRM Dashboard**: `/admin/crm` in the application

## Security Notes

- **Never** commit Zoho credentials to git
- **Always** use Supabase secrets for API keys
- **Monitor** rate limits proactively via dashboard
- **Rotate** refresh tokens every 90 days (Zoho best practice)

---

**Last Updated**: Nov 2, 2025  
**System Status**: Awaiting bootstrap execution  
**Priority**: P0 - CRITICAL
