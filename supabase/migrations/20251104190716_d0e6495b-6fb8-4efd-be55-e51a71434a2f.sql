-- SOTA 2025: Cache table pour analytics push notifications
-- Évite les requêtes lentes et répétées sur user_notifications

CREATE TABLE IF NOT EXISTS public.notification_analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index sur cache_key pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_notification_analytics_cache_key 
ON public.notification_analytics_cache(cache_key);

-- Index sur expires_at pour cleanup automatique
CREATE INDEX IF NOT EXISTS idx_notification_analytics_cache_expires 
ON public.notification_analytics_cache(expires_at);

-- RLS policies
ALTER TABLE public.notification_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics cache"
ON public.notification_analytics_cache
FOR SELECT
TO authenticated
USING (is_admin_user());

CREATE POLICY "System can manage cache"
ON public.notification_analytics_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_notification_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_cache_timestamp
BEFORE UPDATE ON public.notification_analytics_cache
FOR EACH ROW
EXECUTE FUNCTION update_notification_cache_timestamp();

-- Fonction pour nettoyer le cache expiré
CREATE OR REPLACE FUNCTION cleanup_expired_analytics_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.notification_analytics_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;