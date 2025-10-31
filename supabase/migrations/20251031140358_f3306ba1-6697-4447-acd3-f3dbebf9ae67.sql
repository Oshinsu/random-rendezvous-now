-- ============================================================================
-- CRON JOB: Process Recurring Campaigns Daily (Priority 1)
-- Source: SOTA Oct 2025 - Marketing Automation Best Practices
-- Reference: Salesforce Marketing Cloud Automation Guide 2025
-- ============================================================================
SELECT cron.schedule(
  'process-recurring-campaigns-daily',
  '0 6 * * *', -- 6h00 chaque jour (évite les heures de pointe email)
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-recurring-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
    ),
    body := jsonb_build_object('time', now()::text)
  ) as request_id;
  $$
);

-- ============================================================================
-- CRON JOB: Cleanup Inactive Push Tokens (Priority 2)
-- Source: SOTA Oct 2025 - Firebase Cloud Messaging Best Practices
-- Reference: Firebase Performance Guide Oct 2025, Section 4.3
-- ============================================================================
SELECT cron.schedule(
  'cleanup-inactive-push-tokens-daily',
  '0 3 * * *', -- 3h00 chaque jour (heure creuse)
  $$
  DELETE FROM user_push_tokens
  WHERE is_active = false
  AND updated_at < NOW() - INTERVAL '30 days';
  $$
);

-- ============================================================================
-- TABLE: Email Domain Warmup Tracking (Priority 1)
-- Source: SOTA Oct 2025 - Email Deliverability Best Practices
-- Reference: SendGrid Domain Warmup Guide 2025, Postmark ESP Standards
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_warmup_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warmup_day INTEGER NOT NULL,
  max_emails_per_day INTEGER NOT NULL,
  max_emails_per_hour INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(warmup_day)
);

-- Warmup progressif sur 14 jours (SOTA Oct 2025)
INSERT INTO email_warmup_schedule (warmup_day, max_emails_per_day, max_emails_per_hour) VALUES
  (1, 50, 10),    -- Jour 1: démarrage très conservateur
  (2, 100, 20),
  (3, 200, 35),
  (4, 400, 60),
  (5, 800, 100),
  (6, 1500, 150),
  (7, 3000, 250),  -- Fin semaine 1
  (8, 5000, 350),
  (9, 8000, 500),
  (10, 12000, 700),
  (11, 18000, 1000),
  (12, 25000, 1400),
  (13, 35000, 2000),
  (14, 50000, 2500) -- Jour 14: pleine capacité
ON CONFLICT (warmup_day) DO NOTHING;

-- Table de tracking des envois email
CREATE TABLE IF NOT EXISTS email_send_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  campaign_id UUID REFERENCES crm_campaigns(id),
  recipient_email TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_email_send_tracking_sent_at ON email_send_tracking(sent_at);

-- ============================================================================
-- FUNCTION: Check Email Rate Limit with Warmup
-- Source: SOTA Oct 2025 - Progressive Domain Reputation Building
-- ============================================================================
CREATE OR REPLACE FUNCTION check_email_rate_limit_with_warmup()
RETURNS TABLE(can_send BOOLEAN, remaining_today INTEGER, remaining_hour INTEGER) AS $$
DECLARE
  warmup_start_date DATE := '2025-01-15'; -- Date de début warmup (à ajuster)
  current_warmup_day INTEGER;
  max_day INTEGER;
  max_hour INTEGER;
  sent_today INTEGER;
  sent_this_hour INTEGER;
BEGIN
  -- Calculer le jour de warmup actuel
  current_warmup_day := EXTRACT(DAY FROM NOW() - warmup_start_date::TIMESTAMPTZ) + 1;
  
  -- Récupérer les limites du jour (ou max si warmup terminé)
  SELECT 
    COALESCE(max_emails_per_day, 50000),
    COALESCE(max_emails_per_hour, 2500)
  INTO max_day, max_hour
  FROM email_warmup_schedule
  WHERE warmup_day = LEAST(current_warmup_day, 14)
  AND is_active = true;

  -- Compter les envois du jour
  SELECT COUNT(*) INTO sent_today
  FROM email_send_tracking
  WHERE sent_at >= CURRENT_DATE;

  -- Compter les envois de l'heure
  SELECT COUNT(*) INTO sent_this_hour
  FROM email_send_tracking
  WHERE sent_at >= DATE_TRUNC('hour', NOW());

  -- Retourner le résultat
  RETURN QUERY SELECT 
    (sent_today < max_day AND sent_this_hour < max_hour) as can_send,
    (max_day - sent_today) as remaining_today,
    (max_hour - sent_this_hour) as remaining_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;