-- Fix security issues by setting proper search_path for new functions

CREATE OR REPLACE FUNCTION public.transition_groups_to_completed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    transitioned_count integer := 0;
BEGIN
    -- Transition confirmed groups to completed if meeting time has passed
    UPDATE public.groups 
    SET status = 'completed'
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '30 minutes'
    AND bar_name IS NOT NULL;
    
    GET DIAGNOSTICS transitioned_count = ROW_COUNT;
    RAISE NOTICE 'Transitioned % groups from confirmed to completed', transitioned_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;