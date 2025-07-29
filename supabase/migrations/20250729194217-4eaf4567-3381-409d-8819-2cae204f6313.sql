-- Étape 1: Nettoyer les données de test
DELETE FROM public.user_outings_history 
WHERE bar_name = 'Test Bar';

DELETE FROM public.group_participants 
WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE bar_name = 'Test Bar'
);

DELETE FROM public.groups 
WHERE bar_name = 'Test Bar';

-- Étape 2: Corriger le trigger set_completed_at pour qu'il fonctionne correctement
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Quand le statut passe à 'completed', définir completed_at automatiquement
    IF NEW.status = 'completed' AND (OLD.completed_at IS NULL OR NEW.completed_at IS NULL) THEN
        NEW.completed_at = NOW();
        RAISE NOTICE 'Setting completed_at to % for group %', NEW.completed_at, NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Étape 3: Corriger le trigger add_to_outings_history pour qu'il soit plus fiable
CREATE OR REPLACE FUNCTION public.add_to_outings_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count integer := 0;
BEGIN
    RAISE NOTICE 'add_to_outings_history trigger fired: OLD.status=%, NEW.status=%, bar_name=%, completed_at=%', 
        COALESCE(OLD.status, 'NULL'), NEW.status, NEW.bar_name, NEW.completed_at;
    
    -- Vérifier si le groupe passe au statut 'completed' ET a un bar assigné
    IF (OLD.status IS NULL OR OLD.status != 'completed') 
       AND NEW.status = 'completed' 
       AND NEW.bar_name IS NOT NULL 
       AND NEW.completed_at IS NOT NULL THEN
        
        -- Ajouter chaque participant confirmé à l'historique
        INSERT INTO public.user_outings_history (
            user_id,
            group_id,
            bar_name,
            bar_address,
            meeting_time,
            participants_count,
            bar_latitude,
            bar_longitude,
            completed_at
        )
        SELECT DISTINCT
            gp.user_id,
            NEW.id,
            NEW.bar_name,
            COALESCE(NEW.bar_address, 'Adresse non disponible'),
            NEW.meeting_time,
            NEW.current_participants,
            NEW.bar_latitude,
            NEW.bar_longitude,
            NEW.completed_at
        FROM public.group_participants gp
        WHERE gp.group_id = NEW.id 
            AND gp.status = 'confirmed'
            -- Éviter les doublons
            AND NOT EXISTS (
                SELECT 1 FROM public.user_outings_history uoh
                WHERE uoh.group_id = NEW.id AND uoh.user_id = gp.user_id
            );
        
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RAISE NOTICE 'Inserted % entries into user_outings_history for group %', inserted_count, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Étape 4: S'assurer que les triggers sont bien attachés
DROP TRIGGER IF EXISTS set_completed_at_trigger ON public.groups;
CREATE TRIGGER set_completed_at_trigger
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_completed_at();

DROP TRIGGER IF EXISTS add_to_outings_history_trigger ON public.groups;
CREATE TRIGGER add_to_outings_history_trigger
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.add_to_outings_history();

-- Étape 5: Corriger les groupes existants qui sont 'completed' mais n'ont pas de completed_at
UPDATE public.groups 
SET completed_at = created_at + INTERVAL '2 hours'
WHERE status = 'completed' 
    AND completed_at IS NULL
    AND bar_name IS NOT NULL;

-- Étape 6: Générer l'historique manquant pour les groupes existants
INSERT INTO public.user_outings_history (
    user_id,
    group_id,
    bar_name,
    bar_address,
    meeting_time,
    participants_count,
    bar_latitude,
    bar_longitude,
    completed_at
)
SELECT DISTINCT
    gp.user_id,
    g.id,
    g.bar_name,
    COALESCE(g.bar_address, 'Adresse non disponible'),
    g.meeting_time,
    g.current_participants,
    g.bar_latitude,
    g.bar_longitude,
    g.completed_at
FROM public.groups g
JOIN public.group_participants gp ON gp.group_id = g.id
WHERE g.status = 'completed'
    AND g.bar_name IS NOT NULL
    AND g.completed_at IS NOT NULL
    AND gp.status = 'confirmed'
    -- Éviter les doublons
    AND NOT EXISTS (
        SELECT 1 FROM public.user_outings_history uoh
        WHERE uoh.group_id = g.id AND uoh.user_id = gp.user_id
    );