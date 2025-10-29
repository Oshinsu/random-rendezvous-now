-- ============================================
-- PHASE 1: TABLES NOTIFICATIONS PUSH WEB
-- SOTA Octobre 2025 - Firebase Cloud Messaging
-- ============================================

-- Table pour les préférences de notifications par utilisateur
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Canaux activés
  channel_push BOOLEAN NOT NULL DEFAULT true,
  channel_email BOOLEAN NOT NULL DEFAULT true,
  channel_sms BOOLEAN NOT NULL DEFAULT false,
  
  -- Types de notifications (granularité fine)
  notify_group_lifecycle BOOLEAN NOT NULL DEFAULT true,      -- Groupe formé, confirmé, rappels
  notify_group_messages BOOLEAN NOT NULL DEFAULT true,       -- Nouveaux messages chat
  notify_peak_hours BOOLEAN NOT NULL DEFAULT true,           -- Suggestions créneaux peak
  notify_reengagement BOOLEAN NOT NULL DEFAULT true,         -- Campagnes win-back
  notify_marketing BOOLEAN NOT NULL DEFAULT false,           -- Promotions, nouveautés
  
  -- Quiet hours (ne pas déranger)
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Désabonnement total
  unsubscribed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_notification_prefs_user ON user_notification_preferences(user_id);

-- RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage preferences"
  ON user_notification_preferences
  FOR ALL
  USING ((auth.jwt()->>'role')::text = 'service_role');

-- Table pour rate limiting des notifications
CREATE TABLE IF NOT EXISTS notification_throttle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index composite pour vérifications rapides
  CONSTRAINT unique_throttle_entry UNIQUE (user_id, notification_type, sent_at)
);

-- Index pour nettoyage automatique
CREATE INDEX idx_throttle_cleanup ON notification_throttle(sent_at);
CREATE INDEX idx_throttle_user_type ON notification_throttle(user_id, notification_type);

-- RLS
ALTER TABLE notification_throttle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage throttle"
  ON notification_throttle
  FOR ALL
  USING ((auth.jwt()->>'role')::text = 'service_role');

-- Nettoyage automatique des entrées > 7 jours
CREATE OR REPLACE FUNCTION cleanup_notification_throttle()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM notification_throttle
  WHERE sent_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Fonction pour vérifier le rate limit
CREATE OR REPLACE FUNCTION check_notification_rate_limit(
  p_user_id UUID,
  p_notification_type TEXT,
  p_max_per_day INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Compter les notifications du même type dans les dernières 24h
  SELECT COUNT(*)
  INTO v_count
  FROM notification_throttle
  WHERE user_id = p_user_id
    AND notification_type = p_notification_type
    AND sent_at > NOW() - INTERVAL '24 hours';
  
  RETURN v_count < p_max_per_day;
END;
$$;

-- Fonction pour enregistrer un envoi de notification
CREATE OR REPLACE FUNCTION record_notification_send(
  p_user_id UUID,
  p_notification_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_throttle (user_id, notification_type)
  VALUES (p_user_id, p_notification_type);
END;
$$;

COMMENT ON TABLE user_notification_preferences IS 'SOTA Oct 2025: Préférences granulaires de notifications par utilisateur';
COMMENT ON TABLE notification_throttle IS 'SOTA Oct 2025: Rate limiting intelligent pour éviter spam (max 5/jour par type)';
COMMENT ON FUNCTION check_notification_rate_limit IS 'Vérifie si un utilisateur peut recevoir une notification (rate limit)';
COMMENT ON FUNCTION record_notification_send IS 'Enregistre un envoi de notification pour rate limiting';