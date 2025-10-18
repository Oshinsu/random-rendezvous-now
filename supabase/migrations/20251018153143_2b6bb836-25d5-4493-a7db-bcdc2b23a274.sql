-- Restore the auto bar assignment trigger
-- This trigger is essential for the automatic bar assignment process

-- First, check if the function exists (it should from previous migrations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'trigger_auto_bar_assignment'
    ) THEN
        RAISE EXCEPTION 'Function trigger_auto_bar_assignment does not exist. Cannot create trigger.';
    END IF;
END $$;

-- Drop the trigger if it exists (cleanup)
DROP TRIGGER IF EXISTS tg_trigger_auto_bar_assignment ON public.groups;

-- Create the trigger that will fire when a group becomes confirmed
CREATE TRIGGER tg_trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    WHEN (OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL)
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();

-- Log success
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger tg_trigger_auto_bar_assignment successfully restored';
    RAISE NOTICE 'This trigger will fire when: OLD.status = waiting AND NEW.status = confirmed AND NEW.bar_name IS NULL';
END $$;