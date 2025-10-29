-- Phase 5 (corrected): Add A/B Testing columns to notification_analytics
-- SOTA October 2025: A/B Testing & Analytics
-- Source: NOTIFICATION_SYSTEM_SOTA_2025.md ligne 173-203

-- Add missing columns for A/B testing and detailed analytics
ALTER TABLE notification_analytics 
ADD COLUMN IF NOT EXISTS variant_id TEXT,
ADD COLUMN IF NOT EXISTS is_control_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS variant_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS filtered_recipients INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_sends INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_sends INTEGER DEFAULT 0;

-- Index for A/B test queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_notification_analytics_variant 
ON notification_analytics(variant_id, event_type);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_type_created 
ON notification_analytics(event_type, created_at DESC);

-- Comments for documentation
COMMENT ON COLUMN notification_analytics.variant_id IS 'A/B test variant identifier (e.g., "title_v1", "title_v2", "image_v1")';
COMMENT ON COLUMN notification_analytics.is_control_group IS 'True if this is the control group for A/B testing';
COMMENT ON COLUMN notification_analytics.variant_metadata IS 'Additional A/B test metadata (e.g., variant content, hypothesis)';
COMMENT ON COLUMN notification_analytics.total_recipients IS 'Total number of users targeted';
COMMENT ON COLUMN notification_analytics.filtered_recipients IS 'Number of users after filtering (rate limits, preferences, quiet hours)';
COMMENT ON COLUMN notification_analytics.successful_sends IS 'Number of successfully sent push notifications';
COMMENT ON COLUMN notification_analytics.failed_sends IS 'Number of failed push notification sends';