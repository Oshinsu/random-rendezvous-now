-- Ajouter le setting pour contrôler Google OAuth
INSERT INTO public.system_settings (setting_key, setting_value, updated_at)
VALUES ('google_oauth_enabled', 'true', NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Créer une fonction RPC pour vérifier l'état OAuth (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_google_oauth_enabled()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  enabled_value text;
BEGIN
  -- Récupérer le setting (stocké comme string "true"/"false")
  SELECT setting_value->>0 INTO enabled_value
  FROM public.system_settings
  WHERE setting_key = 'google_oauth_enabled';
  
  -- Par défaut true si le setting n'existe pas (failsafe)
  RETURN COALESCE(enabled_value = 'true', true);
END;
$$;

-- Grant execute à authenticated users
GRANT EXECUTE ON FUNCTION public.is_google_oauth_enabled() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_google_oauth_enabled() TO anon;

COMMENT ON FUNCTION public.is_google_oauth_enabled() IS 
'Vérifie si Google OAuth est activé côté backend. Retourne true par défaut (failsafe).';

-- Enable realtime for system_settings changes
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;