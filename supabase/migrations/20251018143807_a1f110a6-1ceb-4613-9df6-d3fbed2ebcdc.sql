
-- ============================================
-- RECRÉATION TRIGGER AUTO-ASSIGNMENT
-- Version robuste avec validation stricte
-- ============================================

-- Vérification de la fonction trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'trigger_auto_bar_assignment'
        AND n.nspname = 'public'
    ) THEN
        RAISE EXCEPTION 'ERREUR CRITIQUE: La fonction trigger_auto_bar_assignment() n''existe pas';
    END IF;
END $$;

-- Suppression propre de tout trigger existant
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups CASCADE;

-- Création du trigger
CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (
        OLD.status = 'waiting' 
        AND NEW.status = 'confirmed' 
        AND NEW.bar_name IS NULL
    )
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- Validation stricte de la création
DO $$
DECLARE
    trigger_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE event_object_table = 'groups' 
        AND trigger_name = 'tg_trigger_auto_bar_assignment'
        AND event_object_schema = 'public'
    ) INTO trigger_exists;
    
    IF NOT trigger_exists THEN
        RAISE EXCEPTION 'ÉCHEC: Le trigger n''a pas été créé correctement';
    END IF;
    
    RAISE NOTICE '✅ Trigger tg_trigger_auto_bar_assignment créé et validé avec succès';
END $$;
