-- Update filter_valid_notification_recipients to use new user_notification_preferences table
-- This function is called by send-push-notification edge function

CREATE OR REPLACE FUNCTION filter_valid_notification_recipients(
  p_user_ids UUID[],
  p_notification_type TEXT
) RETURNS UUID[] 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_ids UUID[] := '{}';
  user_id UUID;
  notification_count INTEGER;
  can_send BOOLEAN;
BEGIN
  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN '{}';
  END IF;
  
  RAISE NOTICE '🔍 Filtering % users for notification type: %', array_length(p_user_ids, 1), p_notification_type;
  
  -- Loop through each user
  FOREACH user_id IN ARRAY p_user_ids LOOP
    -- Use the should_send_notification function to check all preferences
    can_send := should_send_notification(user_id, p_notification_type);
    
    IF NOT can_send THEN
      RAISE NOTICE '🔕 User % cannot receive notification (preferences/quiet hours)', user_id;
      CONTINUE;
    END IF;
    
    -- Check rate limit (max 5 per day per type)
    SELECT COUNT(*) INTO notification_count
    FROM notification_throttle
    WHERE notification_throttle.user_id = filter_valid_notification_recipients.user_id
      AND notification_type = p_notification_type
      AND sent_at > NOW() - INTERVAL '24 hours';
    
    IF notification_count >= 5 THEN
      RAISE NOTICE '⚠️ User % exceeded rate limit (5/day)', user_id;
      CONTINUE;
    END IF;
    
    -- User passed all filters
    result_ids := array_append(result_ids, user_id);
  END LOOP;
  
  RAISE NOTICE '✅ % users passed all filters', array_length(result_ids, 1);
  RETURN result_ids;
END;
$$;

COMMENT ON FUNCTION filter_valid_notification_recipients IS 'SOTA November 2025: Filter users based on granular preferences, rate limits, and quiet hours';
