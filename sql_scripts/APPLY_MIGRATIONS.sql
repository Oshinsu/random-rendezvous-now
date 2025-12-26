-- ============================================================================
-- CRM EMAIL SYSTEM: MIGRATIONS TO APPLY MANUALLY
-- ============================================================================
-- Execute this ENTIRE file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PHASE 1: Add Retry Columns to campaign_email_queue
-- ============================================================================

DO $$ 
BEGIN
  -- Add retry_count if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaign_email_queue' AND column_name = 'retry_count'
  ) THEN
    ALTER TABLE public.campaign_email_queue 
    ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
    
    RAISE NOTICE '✅ Added retry_count column';
  END IF;

  -- Add last_error if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaign_email_queue' AND column_name = 'last_error'
  ) THEN
    ALTER TABLE public.campaign_email_queue 
    ADD COLUMN last_error TEXT;
    
    RAISE NOTICE '✅ Added last_error column';
  END IF;

  -- Add next_retry_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaign_email_queue' AND column_name = 'next_retry_at'
  ) THEN
    ALTER TABLE public.campaign_email_queue 
    ADD COLUMN next_retry_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE '✅ Added next_retry_at column';
  END IF;
END $$;

-- ============================================================================
-- PHASE 2: Create Dead Letter Queue (DLQ) Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_email_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_subject TEXT NOT NULL,
  email_content TEXT NOT NULL,
  
  -- Error tracking
  total_attempts INTEGER NOT NULL DEFAULT 0,
  final_error TEXT NOT NULL,
  error_type TEXT, -- 'rate_limit', 'auth_failure', 'invalid_email', 'network_error'
  
  -- Original queue metadata
  original_queue_id UUID,
  first_attempted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  moved_to_dlq_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Reprocessing
  reprocessed BOOLEAN NOT NULL DEFAULT false,
  reprocessed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_attempts CHECK (total_attempts >= 0 AND total_attempts <= 10)
);

-- Indexes for DLQ
CREATE INDEX IF NOT EXISTS idx_dlq_campaign_id ON public.campaign_email_dlq(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dlq_moved_at ON public.campaign_email_dlq(moved_to_dlq_at DESC);
CREATE INDEX IF NOT EXISTS idx_dlq_reprocessed ON public.campaign_email_dlq(reprocessed) WHERE NOT reprocessed;
CREATE INDEX IF NOT EXISTS idx_dlq_error_type ON public.campaign_email_dlq(error_type);

-- ============================================================================
-- PHASE 3: Create Campaign Stats RPC Function (N+1 Fix)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_campaigns_with_stats()
RETURNS TABLE (
  id UUID,
  campaign_name TEXT,
  campaign_type TEXT,
  subject TEXT,
  content TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  send_at TIMESTAMP WITH TIME ZONE,
  sent_count BIGINT,
  open_count BIGINT,
  click_count BIGINT,
  total_recipients BIGINT,
  failed_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.campaign_name,
    c.campaign_type,
    c.subject,
    c.content,
    c.status,
    c.created_at,
    c.updated_at,
    c.send_at,
    COALESCE(stats.sent_count, 0) AS sent_count,
    COALESCE(stats.open_count, 0) AS open_count,
    COALESCE(stats.click_count, 0) AS click_count,
    COALESCE(stats.total_recipients, 0) AS total_recipients,
    COALESCE(stats.failed_count, 0) AS failed_count
  FROM public.crm_campaigns c
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
      COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS open_count,
      COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) AS click_count,
      COUNT(*) AS total_recipients,
      COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
    FROM public.crm_campaign_recipients r
    WHERE r.campaign_id = c.id
  ) stats ON true
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_campaigns_with_stats() TO authenticated;

-- ============================================================================
-- PHASE 4: Create Materialized View for Analytics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.campaign_stats_mv AS
SELECT 
  c.id AS campaign_id,
  c.campaign_name,
  c.campaign_type,
  c.status,
  c.created_at,
  c.send_at,
  COUNT(r.id) AS total_recipients,
  COUNT(r.id) FILTER (WHERE r.status = 'sent') AS sent_count,
  COUNT(r.id) FILTER (WHERE r.status = 'failed') AS failed_count,
  COUNT(r.id) FILTER (WHERE r.opened_at IS NOT NULL) AS open_count,
  COUNT(r.id) FILTER (WHERE r.clicked_at IS NOT NULL) AS click_count,
  ROUND(
    100.0 * COUNT(r.id) FILTER (WHERE r.opened_at IS NOT NULL) / 
    NULLIF(COUNT(r.id) FILTER (WHERE r.status = 'sent'), 0), 
    2
  ) AS open_rate,
  ROUND(
    100.0 * COUNT(r.id) FILTER (WHERE r.clicked_at IS NOT NULL) / 
    NULLIF(COUNT(r.id) FILTER (WHERE r.opened_at IS NOT NULL), 0), 
    2
  ) AS click_rate
FROM public.crm_campaigns c
LEFT JOIN public.crm_campaign_recipients r ON r.campaign_id = c.id
GROUP BY c.id, c.campaign_name, c.campaign_type, c.status, c.created_at, c.send_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_stats_mv_id ON public.campaign_stats_mv(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_mv_created ON public.campaign_stats_mv(created_at DESC);

CREATE OR REPLACE FUNCTION public.refresh_campaign_stats_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.campaign_stats_mv;
END;
$$;

-- ============================================================================
-- PHASE 5: Enable Realtime on campaign_email_queue
-- ============================================================================

ALTER TABLE public.campaign_email_queue REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'campaign_email_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_email_queue;
    RAISE NOTICE '✅ Added campaign_email_queue to Realtime';
  ELSE
    RAISE NOTICE '⚠️ campaign_email_queue already in Realtime';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check retry columns
SELECT 
  column_name, 
  data_type, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'campaign_email_queue' 
  AND column_name IN ('retry_count', 'last_error', 'next_retry_at')
ORDER BY column_name;

-- Check DLQ table
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'campaign_email_dlq'
ORDER BY ordinal_position;

-- Check RPC function
SELECT proname AS function_name
FROM pg_proc
WHERE proname = 'get_campaigns_with_stats';

-- Check materialized view
SELECT schemaname, matviewname, hasindexes
FROM pg_matviews
WHERE matviewname = 'campaign_stats_mv';

-- Check Realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'campaign_email_queue';

DO $$
BEGIN
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '🎉 CRM Migrations Complete!';
  RAISE NOTICE '🎉 ============================================';
END $$;
