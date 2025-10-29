-- Phase 1: Add is_active column to user_push_tokens
ALTER TABLE user_push_tokens ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active, user_id);

-- Update existing tokens to be active
UPDATE user_push_tokens SET is_active = true WHERE is_active IS NULL;

-- Phase 2: Create RPC filter_valid_notification_recipients
CREATE OR REPLACE FUNCTION filter_valid_notification_recipients(
  p_user_ids UUID[],
  p_notification_type TEXT
) RETURNS UUID[] AS $$
DECLARE
  result_ids UUID[];
  current_hour INTEGER;
BEGIN
  current_hour := EXTRACT(HOUR FROM NOW());
  
  SELECT ARRAY_AGG(DISTINCT user_id)
  INTO result_ids
  FROM unnest(p_user_ids) AS user_id
  WHERE 
    -- Check rate limit (max 5 notifications per day by default)
    check_notification_rate_limit(user_id, p_notification_type, 5)
    
    -- Check quiet hours (22h-9h by default)
    AND NOT (current_hour >= 22 OR current_hour < 9)
    
    -- Check user preferences if table exists
    AND NOT EXISTS (
      SELECT 1 FROM user_email_preferences
      WHERE user_email_preferences.user_id = user_id
      AND push_enabled = false
    );
  
  RETURN COALESCE(result_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;