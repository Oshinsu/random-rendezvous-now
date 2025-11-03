-- Table des préférences de notifications utilisateur
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter les colonnes si elles n'existent pas
DO $$ 
BEGIN
  -- Colonne enabled
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'enabled') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN enabled BOOLEAN DEFAULT true;
  END IF;
  
  -- Types granulaires de notifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'groups_notifications') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN groups_notifications BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'bars_notifications') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN bars_notifications BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'lifecycle_notifications') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN lifecycle_notifications BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'messages_notifications') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN messages_notifications BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'promotions_notifications') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN promotions_notifications BOOLEAN DEFAULT false;
  END IF;
  
  -- Paramètres avancés
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'quiet_hours_start') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN quiet_hours_start INTEGER DEFAULT 22;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'quiet_hours_end') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN quiet_hours_end INTEGER DEFAULT 9;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'max_per_day') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN max_per_day INTEGER DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'sound_enabled') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN sound_enabled BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'vibration_enabled') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN vibration_enabled BOOLEAN DEFAULT true;
  END IF;
  
  -- Personnalisation (admin-only)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'custom_copies') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN custom_copies JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' AND column_name = 'custom_images') THEN
    ALTER TABLE user_notification_preferences ADD COLUMN custom_images JSONB DEFAULT '{}';
  END IF;
END $$;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_user_id ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_enabled ON user_notification_preferences(enabled);

-- RLS Policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON user_notification_preferences;
CREATE POLICY "Users can view their own preferences"
  ON user_notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_notification_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON user_notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_notification_preferences;
CREATE POLICY "Users can update their own preferences"
  ON user_notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour vérifier si une notification doit être envoyée
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id UUID,
  p_notification_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  prefs user_notification_preferences%ROWTYPE;
  current_hour INTEGER;
BEGIN
  SELECT * INTO prefs
  FROM user_notification_preferences
  WHERE user_id = p_user_id;

  IF prefs IS NULL THEN
    RETURN true;
  END IF;

  IF NOT prefs.enabled THEN
    RETURN false;
  END IF;

  IF p_notification_type ILIKE '%group%' AND NOT prefs.groups_notifications THEN
    RETURN false;
  ELSIF p_notification_type ILIKE '%bar%' AND NOT prefs.bars_notifications THEN
    RETURN false;
  ELSIF p_notification_type IN ('welcome', 'first_win', 'comeback') AND NOT prefs.lifecycle_notifications THEN
    RETURN false;
  ELSIF p_notification_type ILIKE '%message%' AND NOT prefs.messages_notifications THEN
    RETURN false;
  ELSIF p_notification_type ILIKE '%promotion%' AND NOT prefs.promotions_notifications THEN
    RETURN false;
  END IF;

  current_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Europe/Paris'))::INTEGER;
  
  IF prefs.quiet_hours_start < prefs.quiet_hours_end THEN
    IF current_hour >= prefs.quiet_hours_start OR current_hour < prefs.quiet_hours_end THEN
      RETURN false;
    END IF;
  ELSE
    IF current_hour >= prefs.quiet_hours_start AND current_hour < prefs.quiet_hours_end THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;