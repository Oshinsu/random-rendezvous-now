-- PHASE 6: ANALYTICS & OPTIMIZATION
-- Enhance notification_analytics table with engagement metrics

-- Add missing columns for tracking opens, clicks, conversions
ALTER TABLE notification_analytics
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS converted_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS open_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS click_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2);

-- Create function to automatically calculate rates
CREATE OR REPLACE FUNCTION calculate_notification_rates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.open_rate = CASE 
    WHEN NEW.successful_sends > 0 THEN 
      (NEW.opened_count::DECIMAL / NEW.successful_sends) * 100
    ELSE 0
  END;
  
  NEW.click_rate = CASE 
    WHEN NEW.opened_count > 0 THEN 
      (NEW.clicked_count::DECIMAL / NEW.opened_count) * 100
    ELSE 0
  END;
  
  NEW.conversion_rate = CASE 
    WHEN NEW.clicked_count > 0 THEN 
      (NEW.converted_count::DECIMAL / NEW.clicked_count) * 100
    ELSE 0
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate rates on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_notification_rates ON notification_analytics;
CREATE TRIGGER trigger_calculate_notification_rates
  BEFORE INSERT OR UPDATE ON notification_analytics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_notification_rates();

-- Create table for scheduled notifications (PHASE 4: Send-Time Optimization)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  notification_data JSONB NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for 
  ON scheduled_notifications(scheduled_for) 
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id
  ON scheduled_notifications(user_id);

-- Add RLS policies for scheduled_notifications
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scheduled notifications
CREATE POLICY "Users can view their own scheduled notifications"
  ON scheduled_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update/delete (edge functions)
CREATE POLICY "Service role can manage scheduled notifications"
  ON scheduled_notifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE scheduled_notifications IS 'PHASE 4: Stores notifications scheduled for optimal send time using send-time optimization';
COMMENT ON TABLE notification_analytics IS 'PHASE 6: Enhanced with engagement metrics (opens, clicks, conversions) for analytics dashboard';

-- Create function to track notification opens
CREATE OR REPLACE FUNCTION track_notification_open(p_notification_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update notification as read
  UPDATE user_notifications
  SET read_at = NOW()
  WHERE id = p_notification_id AND user_id = p_user_id AND read_at IS NULL;
  
  -- Increment opened_count in analytics
  UPDATE notification_analytics
  SET 
    opened_count = opened_count + 1,
    updated_at = NOW()
  WHERE notification_type = (
    SELECT type FROM user_notifications WHERE id = p_notification_id
  )
  AND DATE(created_at) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track notification clicks
CREATE OR REPLACE FUNCTION track_notification_click(p_notification_id UUID, p_user_id UUID, p_action TEXT DEFAULT 'default')
RETURNS VOID AS $$
BEGIN
  -- Increment clicked_count in analytics
  UPDATE notification_analytics
  SET 
    clicked_count = clicked_count + 1,
    updated_at = NOW()
  WHERE notification_type = (
    SELECT type FROM user_notifications WHERE id = p_notification_id
  )
  AND DATE(created_at) = CURRENT_DATE;
  
  -- Log the click action in metadata
  UPDATE user_notifications
  SET data = jsonb_set(
    COALESCE(data, '{}'::jsonb),
    '{clicked_action}',
    to_jsonb(p_action)
  )
  WHERE id = p_notification_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track notification conversions (e.g., group created after notification)
CREATE OR REPLACE FUNCTION track_notification_conversion(p_notification_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Increment converted_count in analytics
  UPDATE notification_analytics
  SET 
    converted_count = converted_count + 1,
    updated_at = NOW()
  WHERE notification_type = (
    SELECT type FROM user_notifications WHERE id = p_notification_id
  )
  AND DATE(created_at) = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;