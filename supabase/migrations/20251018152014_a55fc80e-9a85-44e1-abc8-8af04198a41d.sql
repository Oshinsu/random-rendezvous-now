-- Ajouter colonne is_test_group pour identifier les groupes de test
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_test_group BOOLEAN DEFAULT false;

-- Index pour faciliter le cleanup des groupes de test
CREATE INDEX IF NOT EXISTS idx_groups_test ON public.groups(is_test_group) WHERE is_test_group = true;

-- Modifier le trigger pour bypass la validation sur les groupes de test
CREATE OR REPLACE FUNCTION public.validate_group_participant_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    is_test BOOLEAN;
BEGIN
    -- Vérifier si c'est un groupe de test
    SELECT is_test_group INTO is_test
    FROM public.groups
    WHERE id = NEW.group_id;
    
    -- Bypass validation si groupe de test
    IF is_test THEN
        RAISE NOTICE 'Test group detected, skipping participation limit check';
        RETURN NEW;
    END IF;
    
    -- Validation normale pour les groupes réels
    IF NOT public.check_user_participation_limit(NEW.user_id) THEN
        RAISE EXCEPTION 'User has reached the participation limit (1 active group + max 2 scheduled groups)';
    END IF;
    
    -- Valider les coordonnées si présentes
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        IF NOT public.validate_coordinates_strict(NEW.latitude, NEW.longitude) THEN
            RAISE EXCEPTION 'Invalid participant coordinates';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;