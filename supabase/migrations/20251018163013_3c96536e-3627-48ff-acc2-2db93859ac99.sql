-- ============================================================
-- OPTION A: Architecture Backend Pure pour Auto-Assignment Bar
-- ============================================================

-- 1. Recréer la fonction trigger avec appel HTTP direct
CREATE OR REPLACE FUNCTION public.trigger_auto_bar_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    request_id BIGINT;
    api_url TEXT := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/trigger-bar-assignment';
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE '🔥 [TRIGGER] AUTO_BAR_ASSIGNMENT FIRED';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Group ID: %', NEW.id;
    RAISE NOTICE 'Status transition: % → %', OLD.status, NEW.status;
    RAISE NOTICE 'Bar name: %', COALESCE(NEW.bar_name, 'NULL');
    RAISE NOTICE 'Coordinates: lat=%, lng=%', NEW.latitude, NEW.longitude;
    RAISE NOTICE '------------------------------------------------------------';
    
    -- Appel HTTP via pg_net (asynchrone)
    SELECT net.http_post(
        url := api_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'group_id', NEW.id::text
        ),
        timeout_milliseconds := 30000
    ) INTO request_id;
    
    RAISE NOTICE '📡 [TRIGGER] HTTP request sent to trigger-bar-assignment';
    RAISE NOTICE 'Request ID: %', request_id;
    RAISE NOTICE '============================================================';
    
    RETURN NEW;
END;
$function$;

-- 2. Recréer le trigger
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;

CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (
        OLD.status = 'waiting' 
        AND NEW.status = 'confirmed' 
        AND NEW.bar_name IS NULL
    )
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- 3. Vérification et logs
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Vérifier trigger
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'tg_trigger_auto_bar_assignment'
        AND event_object_table = 'groups'
    ) INTO trigger_exists;
    
    -- Vérifier function
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'trigger_auto_bar_assignment'
    ) INTO function_exists;
    
    IF trigger_exists AND function_exists THEN
        RAISE NOTICE '============================================================';
        RAISE NOTICE '✅ SUCCESS: Backend Pure Architecture Configured';
        RAISE NOTICE '============================================================';
        RAISE NOTICE 'Trigger: tg_trigger_auto_bar_assignment → ACTIVE';
        RAISE NOTICE 'Function: trigger_auto_bar_assignment() → ACTIVE';
        RAISE NOTICE '';
        RAISE NOTICE 'Workflow:';
        RAISE NOTICE '  1. Group status: waiting → confirmed';
        RAISE NOTICE '  2. Trigger fires → HTTP POST to Edge Function';
        RAISE NOTICE '  3. Edge Function → simple-auto-assign-bar';
        RAISE NOTICE '  4. Google Places API → Bar assignment';
        RAISE NOTICE '  5. UPDATE groups.bar_name';
        RAISE NOTICE '  6. Frontend receives Realtime update';
        RAISE NOTICE '============================================================';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Trigger or function not created properly';
    END IF;
END $$;