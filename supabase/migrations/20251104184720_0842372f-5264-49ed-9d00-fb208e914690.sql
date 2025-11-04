-- ============================================
-- PHASE 3: NOTIFICATION DEDUPLICATION SYSTEM
-- Évite les doublons (max 1 notification par type par jour)
-- SOTA Nov 2025: OneSignal, Braze best practices
-- ============================================

-- Table de déduplication
CREATE TABLE IF NOT EXISTS notification_deduplication (
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_dedup_last_sent ON notification_deduplication(last_sent_at);

COMMENT ON TABLE notification_deduplication IS 'SOTA Nov 2025: Évite les doublons de notifications (1 par type par jour)';

-- ============================================
-- Modifier filter_valid_notification_recipients
-- pour vérifier la déduplication AVANT d'envoyer
-- ============================================

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
  last_sent TIMESTAMPTZ;
BEGIN
  FOREACH user_id IN ARRAY p_user_ids LOOP
    can_send := should_send_notification(user_id, p_notification_type);
    
    IF NOT can_send THEN
      CONTINUE;
    END IF;
    
    -- ✅ NOUVEAU : Vérifier déduplication (1 par type par jour)
    SELECT last_sent_at INTO last_sent
    FROM notification_deduplication
    WHERE notification_deduplication.user_id = filter_valid_notification_recipients.user_id
      AND notification_type = p_notification_type;
    
    IF last_sent IS NOT NULL AND last_sent > NOW() - INTERVAL '24 hours' THEN
      RAISE NOTICE '🔁 User % already received % notification today', user_id, p_notification_type;
      CONTINUE;
    END IF;
    
    -- ✅ Check GLOBAL rate limit (max 5 per day ALL TYPES)
    SELECT COUNT(*) INTO notification_count
    FROM notification_throttle
    WHERE notification_throttle.user_id = filter_valid_notification_recipients.user_id
      AND sent_at > NOW() - INTERVAL '24 hours';
    
    IF notification_count >= 5 THEN
      RAISE NOTICE '⚠️ User % exceeded global rate limit (5/day)', user_id;
      CONTINUE;
    END IF;
    
    result_ids := array_append(result_ids, user_id);
  END LOOP;
  
  RETURN result_ids;
END;
$$;

-- ============================================
-- Modifier record_notification_send
-- pour enregistrer dans la table de déduplication
-- ============================================

CREATE OR REPLACE FUNCTION record_notification_send(
  p_user_id UUID,
  p_notification_type TEXT
) RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Record throttle (pour rate limiting)
  INSERT INTO notification_throttle (user_id, notification_type, sent_at)
  VALUES (p_user_id, p_notification_type, NOW());
  
  -- ✅ NOUVEAU : Record deduplication (pour éviter doublons)
  INSERT INTO notification_deduplication (user_id, notification_type, last_sent_at)
  VALUES (p_user_id, p_notification_type, NOW())
  ON CONFLICT (user_id, notification_type) DO UPDATE
  SET last_sent_at = NOW();
END;
$$;

-- ============================================
-- PHASE 4: Update max_per_day to be GLOBAL
-- ============================================

ALTER TABLE user_notification_preferences 
ALTER COLUMN max_per_day SET DEFAULT 5;

COMMENT ON COLUMN user_notification_preferences.max_per_day IS 'Max notifications par jour (GLOBAL, tous types confondus)';