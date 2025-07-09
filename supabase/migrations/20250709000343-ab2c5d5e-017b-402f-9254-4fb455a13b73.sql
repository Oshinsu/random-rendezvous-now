-- Correction sécuritaire: Ajouter SET search_path = 'public' à la fonction validate_bar_name
-- pour éviter les risques de manipulation du search path

CREATE OR REPLACE FUNCTION public.validate_bar_name(input_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Vérifier que le nom n'est pas un Place ID
  IF input_name IS NULL THEN
    RETURN false;
  END IF;
  
  IF input_name LIKE 'places/%' OR input_name LIKE 'ChIJ%' THEN
    RETURN false;
  END IF;
  
  IF length(trim(input_name)) < 2 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;