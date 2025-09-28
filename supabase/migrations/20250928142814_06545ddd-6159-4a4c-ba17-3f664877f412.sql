-- Amélioration de la sécurité Supabase - PRIORITÉ 1

-- 1. Mise à jour de la configuration d'expiration OTP (réduction du délai)
-- NOTE: Cette partie doit être configurée manuellement dans les paramètres Auth Supabase
-- Délai recommandé : 300 secondes (5 minutes)

-- 2. Table de sécurité pour auditer les connexions suspectes
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('failed_login', 'suspicious_activity', 'password_change', 'email_change')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy pour que seuls les admins puissent voir les logs de sécurité
CREATE POLICY "Only admins can view security logs" ON public.security_audit_log
  FOR SELECT USING (is_admin_user());

-- Index pour optimiser les requêtes
CREATE INDEX idx_security_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_audit_created_at ON public.security_audit_log(created_at);
CREATE INDEX idx_security_audit_event_type ON public.security_audit_log(event_type);

-- 3. Fonction de nettoyage automatique des logs de sécurité (60 jours de rétention)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  DELETE FROM public.security_audit_log 
  WHERE created_at < NOW() - INTERVAL '60 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % old security log entries', deleted_count;
END;
$$;

-- 4. Table de configuration de sécurité pour l'application
CREATE TABLE IF NOT EXISTS public.security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Policy pour que seuls les admins puissent gérer la config de sécurité
CREATE POLICY "Only admins can manage security config" ON public.security_config
  FOR ALL USING (is_admin_user());

-- Insérer les paramètres de sécurité par défaut
INSERT INTO public.security_config (setting_key, setting_value, description) VALUES
  ('max_login_attempts', '5', 'Nombre maximum de tentatives de connexion avant blocage'),
  ('lockout_duration_minutes', '15', 'Durée de blocage en minutes après échec de connexions'),
  ('otp_expiry_seconds', '300', 'Durée de validité des codes OTP en secondes'),
  ('password_min_length', '8', 'Longueur minimale des mots de passe'),
  ('require_email_verification', 'true', 'Exiger la vérification email')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. Trigger pour auditer les modifications de profil sensibles
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auditer les changements d'email ou de nom
  IF (OLD.email IS DISTINCT FROM NEW.email OR 
      OLD.first_name IS DISTINCT FROM NEW.first_name OR 
      OLD.last_name IS DISTINCT FROM NEW.last_name) THEN
    
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      metadata
    ) VALUES (
      NEW.id,
      'profile_change',
      json_build_object(
        'old_email', OLD.email,
        'new_email', NEW.email,
        'old_first_name', OLD.first_name,
        'new_first_name', NEW.first_name,
        'old_last_name', OLD.last_name,
        'new_last_name', NEW.last_name,
        'changed_at', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table profiles
DROP TRIGGER IF EXISTS trigger_audit_profile_changes ON public.profiles;
CREATE TRIGGER trigger_audit_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- 6. Fonction pour obtenir les statistiques de sécurité
CREATE OR REPLACE FUNCTION public.get_security_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  SELECT json_build_object(
    'failed_logins_24h', (
      SELECT COUNT(*) FROM public.security_audit_log 
      WHERE event_type = 'failed_login' 
      AND created_at > NOW() - INTERVAL '24 hours'
    ),
    'profile_changes_7d', (
      SELECT COUNT(*) FROM public.security_audit_log 
      WHERE event_type = 'profile_change' 
      AND created_at > NOW() - INTERVAL '7 days'
    ),
    'total_security_events', (
      SELECT COUNT(*) FROM public.security_audit_log
    ),
    'users_created_24h', (
      SELECT COUNT(*) FROM auth.users 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;