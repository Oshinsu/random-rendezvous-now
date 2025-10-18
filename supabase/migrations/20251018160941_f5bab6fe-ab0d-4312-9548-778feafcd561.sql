-- ============================================================
-- Migration: Créer trigger auto-assignment de bar (FINAL)
-- ============================================================

-- 1. Créer la fonction trigger (si elle n'existe pas)
CREATE OR REPLACE FUNCTION public.trigger_auto_bar_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    service_role_key TEXT;
    request_id BIGINT;
BEGIN
    -- Log trigger execution
    RAISE NOTICE '🔥 TRIGGER FIRED: group % transitioned to confirmed', NEW.id;
    
    -- Get service_role_key from vault
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'supabase_service_role_key'
    LIMIT 1;
    
    -- Warning if key not configured
    IF service_role_key IS NULL OR service_role_key = '' THEN
        RAISE WARNING '⚠️ Service role key not configured. Bar assignment will not be triggered automatically.';
        RETURN NEW;
    END IF;
    
    -- Create system message for traceability
    INSERT INTO public.group_messages (group_id, user_id, message, is_system)
    VALUES (
        NEW.id,
        '00000000-0000-0000-0000-000000000000',
        'AUTO_BAR_ASSIGNMENT_TRIGGER',
        true
    );
    
    -- Call Edge Function via HTTP (pg_net)
    SELECT net.http_post(
        url := current_setting('app.settings.api_url', true) || '/functions/v1/simple-auto-assign-bar',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
            'group_id', NEW.id::text
        ),
        timeout_milliseconds := 30000
    ) INTO request_id;
    
    RAISE NOTICE '📡 HTTP request sent to simple-auto-assign-bar: request_id=%', request_id;
    
    RETURN NEW;
END;
$function$;

-- 2. Drop and recreate the trigger
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;

CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL)
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- 3. Configure API URL setting
DO $$
BEGIN
    -- Set API URL for HTTP calls
    PERFORM set_config('app.settings.api_url', 'https://xhrievvdnajvylyrowwu.supabase.co', false);
    
    RAISE NOTICE '✅ API URL configured: https://xhrievvdnajvylyrowwu.supabase.co';
END $$;

-- 4. Grant permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres, service_role;

-- 5. Verify trigger creation
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'tg_trigger_auto_bar_assignment'
        AND event_object_table = 'groups'
        AND event_object_schema = 'public'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '============================================================';
        RAISE NOTICE '✅ SUCCESS: Trigger tg_trigger_auto_bar_assignment created';
        RAISE NOTICE '============================================================';
        RAISE NOTICE 'Trigger will fire when:';
        RAISE NOTICE '  - OLD.status = waiting';
        RAISE NOTICE '  - NEW.status = confirmed';
        RAISE NOTICE '  - NEW.bar_name IS NULL';
        RAISE NOTICE '';
        RAISE NOTICE 'Actions:';
        RAISE NOTICE '  1. Create AUTO_BAR_ASSIGNMENT_TRIGGER message';
        RAISE NOTICE '  2. Call simple-auto-assign-bar Edge Function';
        RAISE NOTICE '  3. Edge Function queries Google Places API';
        RAISE NOTICE '  4. Bar is assigned to group';
        RAISE NOTICE '============================================================';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Trigger tg_trigger_auto_bar_assignment not created';
    END IF;
END $$;