-- Phase 2: Create RPC filter_valid_notification_recipients
-- SOTA October 2025: Intelligent rate limiting + quiet hours + user preferences
-- Source: NOTIFICATION_SYSTEM_SOTA_2025.md ligne 102-118

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
  current_hour INTEGER;
  user_id UUID;
  notification_count INTEGER;
  has_push_enabled BOOLEAN;
BEGIN
  -- Get current hour (UTC)
  current_hour := EXTRACT(HOUR FROM NOW());
  
  -- SOTA 2025: Check quiet hours (22h-9h UTC)
  -- Source: NOTIFICATION_SYSTEM_SOTA_2025.md ligne 102-118
  IF current_hour >= 22 OR current_hour < 9 THEN
    RAISE NOTICE '🌙 Quiet hours active (22h-9h UTC), filtering all users';
    RETURN result_ids; -- Return empty array
  END IF;
  
  RAISE NOTICE '🔍 Filtering % users for notification type: %', array_length(p_user_ids, 1), p_notification_type;
  
  -- Loop through each user
  FOREACH user_id IN ARRAY p_user_ids LOOP
    -- 1. Check rate limit (max 5 per day per type)
    SELECT COUNT(*) INTO notification_count
    FROM notification_throttle
    WHERE notification_throttle.user_id = filter_valid_notification_recipients.user_id
      AND notification_type = p_notification_type
      AND sent_at > NOW() - INTERVAL '24 hours';
    
    IF notification_count >= 5 THEN
      RAISE NOTICE '⚠️ User % exceeded rate limit (5/day)', user_id;
      CONTINUE;
    END IF;
    
    -- 2. Check user preferences (if user has explicitly disabled push)
    SELECT COALESCE(push_enabled, true) INTO has_push_enabled
    FROM user_email_preferences
    WHERE user_email_preferences.user_id = filter_valid_notification_recipients.user_id;
    
    IF NOT has_push_enabled THEN
      RAISE NOTICE '🔕 User % has push notifications disabled', user_id;
      CONTINUE;
    END IF;
    
    -- User passed all filters
    result_ids := array_append(result_ids, user_id);
  END LOOP;
  
  RAISE NOTICE '✅ % users passed all filters', array_length(result_ids, 1);
  RETURN result_ids;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION filter_valid_notification_recipients(UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION filter_valid_notification_recipients(UUID[], TEXT) TO service_role;

COMMENT ON FUNCTION filter_valid_notification_recipients IS 'SOTA October 2025: Filter users based on rate limits, quiet hours, and preferences';