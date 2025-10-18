-- ============================================
-- MIGRATION: Recréer le trigger d'auto-assignment de bar
-- ============================================
-- PROBLÈME IDENTIFIÉ: Le trigger tg_trigger_auto_bar_assignment 
-- n'existe pas sur la table public.groups, empêchant l'auto-assignment
-- ============================================

-- 1️⃣ Supprimer le trigger s'il existe (au cas où)
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;

-- 2️⃣ Recréer le trigger avec la bonne configuration
CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (
        -- Condition: status passe de 'waiting' à 'confirmed'
        OLD.status = 'waiting' 
        AND NEW.status = 'confirmed' 
        AND NEW.bar_name IS NULL
    )
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- 3️⃣ Vérification: Le trigger doit maintenant exister
DO $$
DECLARE
    trigger_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE event_object_table = 'groups' 
        AND trigger_name = 'tg_trigger_auto_bar_assignment'
    ) INTO trigger_exists;
    
    IF NOT trigger_exists THEN
        RAISE EXCEPTION 'ERREUR: Le trigger tg_trigger_auto_bar_assignment n''a pas été créé !';
    ELSE
        RAISE NOTICE '✅ SUCCESS: Le trigger tg_trigger_auto_bar_assignment a été créé avec succès sur public.groups';
    END IF;
END $$;

-- 4️⃣ Log de confirmation
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Trigger tg_trigger_auto_bar_assignment recréé';
    RAISE NOTICE 'Table: public.groups';
    RAISE NOTICE 'Event: AFTER UPDATE';
    RAISE NOTICE 'Condition: OLD.status = waiting AND NEW.status = confirmed AND NEW.bar_name IS NULL';
    RAISE NOTICE 'Function: public.trigger_auto_bar_assignment()';
    RAISE NOTICE '================================================';
END $$;