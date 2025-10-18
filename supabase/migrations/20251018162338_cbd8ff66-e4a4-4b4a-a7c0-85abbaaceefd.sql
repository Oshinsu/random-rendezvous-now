-- Revenir à l'architecture trigger simple (sans appel HTTP)
-- Le trigger crée juste un message système, le frontend gère l'appel à l'Edge Function

CREATE OR REPLACE FUNCTION public.trigger_auto_bar_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    RAISE NOTICE '🔥 TRIGGER FIRED: group % confirmed, creating assignment message', NEW.id;
    
    -- Create system message that frontend will listen for
    INSERT INTO public.group_messages (group_id, user_id, message, is_system)
    VALUES (
        NEW.id,
        '00000000-0000-0000-0000-000000000000',
        'AUTO_BAR_ASSIGNMENT_TRIGGER',
        true
    );
    
    RAISE NOTICE '✅ Assignment message created for group %', NEW.id;
    
    RETURN NEW;
END;
$function$;

-- Recreate trigger
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;

CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL)
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();