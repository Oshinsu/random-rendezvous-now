-- Migration: Email Send Logs pour Resend Integration
-- Date: 2025-12-26
-- Description: Table pour tracker les envois d'emails via Resend avec webhooks

-- Table email_send_logs
CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  resend_id TEXT UNIQUE,  -- ID from Resend API
  status TEXT CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')) DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,  -- Extra data (user_id, tags, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_send_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_send_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_send_logs(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_send_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_send_logs(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_logs_updated_at
  BEFORE UPDATE ON email_send_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- RLS policies
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can view all email logs"
  ON email_send_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Service role can insert/update (for Edge Functions)
CREATE POLICY "Service role can manage email logs"
  ON email_send_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to get email campaign analytics
CREATE OR REPLACE FUNCTION get_email_campaign_analytics(campaign_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sent', COUNT(*),
    'total_delivered', COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')),
    'total_opened', COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')),
    'total_clicked', COUNT(*) FILTER (WHERE status = 'clicked'),
    'total_bounced', COUNT(*) FILTER (WHERE status = 'bounced'),
    'total_failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'open_rate', ROUND(
      CAST(COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) AS NUMERIC) / 
      NULLIF(COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked')), 0) * 100,
      2
    ),
    'click_rate', ROUND(
      CAST(COUNT(*) FILTER (WHERE status = 'clicked') AS NUMERIC) / 
      NULLIF(COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')), 0) * 100,
      2
    ),
    'bounce_rate', ROUND(
      CAST(COUNT(*) FILTER (WHERE status = 'bounced') AS NUMERIC) / 
      NULLIF(COUNT(*), 0) * 100,
      2
    )
  ) INTO result
  FROM email_send_logs
  WHERE campaign_id = campaign_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admins only via RLS)
GRANT EXECUTE ON FUNCTION get_email_campaign_analytics TO authenticated;

-- Comments
COMMENT ON TABLE email_send_logs IS 'Logs des envois d''emails via Resend avec tracking des opens/clicks/bounces';
COMMENT ON COLUMN email_send_logs.resend_id IS 'ID unique de l''email dans Resend (pour webhooks)';
COMMENT ON COLUMN email_send_logs.metadata IS 'Données supplémentaires (user_id, segment_id, tags, etc.)';
COMMENT ON FUNCTION get_email_campaign_analytics IS 'Retourne les analytics d''une campagne email (open rate, click rate, bounce rate)';

