-- ============================================
-- MIGRATION SYSTÉMIQUE: Auto-assignment de bar
-- Basée sur les best practices Supabase Oct 2025
-- ============================================

-- 🔧 ÉTAPE 1: Vérification pré-migration
DO $$
BEGIN
    -- Vérifier que la fonction trigger existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'trigger_auto_bar_assignment'
    ) THEN
        RAISE EXCEPTION '❌ ERREUR: La fonction trigger_auto_bar_assignment() n''existe pas';
    END IF;
    
    RAISE NOTICE '✅ Fonction trigger_auto_bar_assignment() existe';
END $$;

-- 🧹 ÉTAPE 2: Nettoyage complet
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups CASCADE;

DO $$
BEGIN
    RAISE NOTICE '🧹 Ancien trigger supprimé si existait';
END $$;

-- 🚀 ÉTAPE 3: Création du trigger avec SECURITY DEFINER
-- Syntaxe optimale selon documentation Supabase 2025
CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (
        -- Condition: groupe passe de 'waiting' à 'confirmed' sans bar
        OLD.status = 'waiting' 
        AND NEW.status = 'confirmed' 
        AND NEW.bar_name IS NULL
    )
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

DO $$
BEGIN
    RAISE NOTICE '✅ Trigger tg_trigger_auto_bar_assignment créé';
END $$;

-- ✅ ÉTAPE 4: Validation post-création
DO $$
DECLARE
    trigger_count integer;
    trigger_info record;
BEGIN
    -- Compter les triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'groups' 
    AND trigger_name = 'tg_trigger_auto_bar_assignment'
    AND event_object_schema = 'public';
    
    IF trigger_count = 0 THEN
        RAISE EXCEPTION '❌ VALIDATION ÉCHOUÉE: Le trigger n''a pas été créé';
    END IF;
    
    -- Récupérer les détails du trigger
    SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
    INTO trigger_info
    FROM information_schema.triggers 
    WHERE event_object_table = 'groups' 
    AND trigger_name = 'tg_trigger_auto_bar_assignment'
    AND event_object_schema = 'public';
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ VALIDATION RÉUSSIE';
    RAISE NOTICE 'Trigger: %', trigger_info.trigger_name;
    RAISE NOTICE 'Event: % %', trigger_info.action_timing, trigger_info.event_manipulation;
    RAISE NOTICE 'Action: %', trigger_info.action_statement;
    RAISE NOTICE '================================================';
END $$;

-- 📊 ÉTAPE 5: Test sur groupes existants
DO $$
DECLARE
    test_group_id uuid;
    test_group_status text;
    test_group_participants integer;
BEGIN
    -- Trouver un groupe test (waiting avec 5 participants)
    SELECT id, status, current_participants 
    INTO test_group_id, test_group_status, test_group_participants
    FROM public.groups 
    WHERE status = 'waiting' 
    AND current_participants = 5
    AND bar_name IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF test_group_id IS NOT NULL THEN
        RAISE NOTICE '📊 Groupe test trouvé: % (status=%, participants=%)', 
            test_group_id, test_group_status, test_group_participants;
        RAISE NOTICE '⚠️ Ce groupe passera automatiquement en ''confirmed'' et déclenchera l''auto-assignment';
    ELSE
        RAISE NOTICE '📊 Aucun groupe test disponible pour validation';
    END IF;
END $$;