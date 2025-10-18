-- ============================================================
-- Migration: Fix Trigger Auto Bar Assignment with HTTP Call
-- Description: Add direct HTTP call from trigger to Edge Function
--              using pg_net to ensure automatic bar assignment
-- ============================================================

-- 1. Enable pg_net extension for HTTP calls from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Replace the trigger function with HTTP call capability
CREATE OR REPLACE FUNCTION public.trigger_auto_bar_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    existing_trigger_count integer;
    request_id bigint;
    service_role_key text;
BEGIN
    -- Only trigger when status changes from 'waiting' to 'confirmed' and no bar is assigned
    IF OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL THEN
        
        -- Check for recent triggers to prevent duplicates (within 2 minutes)
        SELECT COUNT(*) INTO existing_trigger_count
        FROM public.group_messages 
        WHERE group_id = NEW.id 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND is_system = true
        AND created_at > NOW() - INTERVAL '2 minutes';
        
        IF existing_trigger_count = 0 THEN
            -- 1. Create system message for traceability
            INSERT INTO public.group_messages (
                group_id,
                user_id,
                message,
                is_system
            ) VALUES (
                NEW.id,
                '00000000-0000-0000-0000-000000000000',
                'AUTO_BAR_ASSIGNMENT_TRIGGER',
                true
            );
            
            -- 2. Get service_role_key from Supabase Vault (secure method)
            -- Note: You need to store the service_role_key in vault.secrets table first
            -- Example: INSERT INTO vault.secrets (secret) VALUES ('your-service-role-key') RETURNING id;
            -- Then set the vault ID here or use app.settings.service_role_key
            
            BEGIN
                -- Try to get from vault first (recommended)
                SELECT decrypted_secret INTO service_role_key 
                FROM vault.decrypted_secrets 
                WHERE name = 'supabase_service_role_key' 
                LIMIT 1;
                
                -- Fallback to app.settings if vault not configured
                IF service_role_key IS NULL THEN
                    service_role_key := current_setting('app.settings.service_role_key', true);
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- If vault is not available, try app.settings
                service_role_key := current_setting('app.settings.service_role_key', true);
            END;
            
            -- 3. Direct HTTP call to Edge Function via pg_net
            IF service_role_key IS NOT NULL THEN
                SELECT INTO request_id extensions.pg_net.http_post(
                    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/simple-auto-assign-bar',
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || service_role_key
                    ),
                    body := jsonb_build_object(
                        'group_id', NEW.id,
                        'latitude', NEW.latitude,
                        'longitude', NEW.longitude
                    )
                );
                
                RAISE NOTICE '✅ Bar assignment HTTP request sent (request_id: %) for group %', request_id, NEW.id;
            ELSE
                RAISE WARNING '⚠️ Service role key not configured. Bar assignment will not be triggered automatically.';
                RAISE NOTICE 'Please configure service_role_key in vault.secrets or app.settings';
            END IF;
        ELSE
            RAISE NOTICE '⚠️ Bar assignment already in progress for group % (skip duplicate)', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 3. Ensure trigger is properly configured (already done in previous migration but verify)
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;

CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL)
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- 4. Grant necessary permissions to pg_net
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- ============================================================
-- IMPORTANT CONFIGURATION INSTRUCTIONS
-- ============================================================
-- 
-- You need to configure the service_role_key securely.
-- 
-- METHOD 1 (RECOMMENDED): Use Supabase Vault
-- ------------------------------------------------
-- Run this in Supabase SQL Editor with service_role permissions:
-- 
-- INSERT INTO vault.secrets (name, secret) 
-- VALUES ('supabase_service_role_key', 'your-actual-service-role-key-here');
-- 
-- METHOD 2 (ALTERNATIVE): Use PostgreSQL Settings
-- ------------------------------------------------
-- Run this with superuser permissions:
-- 
-- ALTER DATABASE postgres SET app.settings.service_role_key TO 'your-actual-service-role-key-here';
-- 
-- Then restart the database or reload configuration:
-- SELECT pg_reload_conf();
-- 
-- ============================================================

-- Log success
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ Trigger HTTP call migration completed successfully';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'The trigger will now:';
    RAISE NOTICE '  1. Detect when a group becomes confirmed (status: waiting → confirmed)';
    RAISE NOTICE '  2. Create a system message for traceability';
    RAISE NOTICE '  3. Call simple-auto-assign-bar Edge Function via HTTP (pg_net)';
    RAISE NOTICE '  4. Edge Function will query Google Places API and assign a bar';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  REQUIRED: Configure service_role_key using one of the methods above';
    RAISE NOTICE '============================================================';
END $$;