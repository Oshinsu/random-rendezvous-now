-- Step 1: Create function to transition confirmed groups to completed after meeting time
CREATE OR REPLACE FUNCTION public.transition_groups_to_completed()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
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

-- Step 2: Backfill historical data for past confirmed groups that should have been completed
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
SELECT 
    gp.user_id,
    g.id,
    g.bar_name,
    g.bar_address,
    g.meeting_time,
    g.current_participants,
    g.bar_latitude,
    g.bar_longitude,
    COALESCE(g.meeting_time + INTERVAL '3 hours', NOW()) as completed_at
FROM public.groups g
JOIN public.group_participants gp ON gp.group_id = g.id
WHERE g.status = 'confirmed'
    AND g.meeting_time IS NOT NULL
    AND g.meeting_time < NOW() - INTERVAL '30 minutes'
    AND g.bar_name IS NOT NULL
    AND gp.status = 'confirmed'
    AND NOT EXISTS (
        SELECT 1 FROM public.user_outings_history uoh 
        WHERE uoh.group_id = g.id AND uoh.user_id = gp.user_id
    );

-- Step 3: Now transition these groups to completed status
SELECT public.transition_groups_to_completed();

-- Step 4: Update cleanup services to use the transition function
CREATE OR REPLACE FUNCTION public.dissolve_old_groups()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    cleanup_count integer := 0;
BEGIN
    -- Log du début du nettoyage
    RAISE NOTICE 'Starting safe cleanup at %', NOW();
    
    -- 0. First, transition confirmed groups to completed status
    BEGIN
        PERFORM public.transition_groups_to_completed();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error transitioning groups to completed: %', SQLERRM;
    END;
    
    -- 1. Supprimer les participants inactifs (12 heures)
    BEGIN
        DELETE FROM public.group_participants 
        WHERE last_seen < NOW() - INTERVAL '12 hours';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % inactive participants', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning participants: %', SQLERRM;
    END;
    
    -- 2. Supprimer les groupes en attente vides (10 minutes)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'waiting'
        AND current_participants = 0
        AND created_at < NOW() - INTERVAL '10 minutes';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % empty waiting groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning waiting groups: %', SQLERRM;
    END;
    
    -- 3. Corriger les compteurs de participants
    BEGIN
        UPDATE public.groups 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM public.group_participants 
            WHERE group_id = groups.id 
            AND status = 'confirmed'
        )
        WHERE status IN ('waiting', 'confirmed');
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Updated % group counters', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating counters: %', SQLERRM;
    END;
    
    -- 4. Nettoyer les messages de déclenchement anciens
    BEGIN
        DELETE FROM public.group_messages 
        WHERE is_system = true 
        AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
        AND created_at < NOW() - INTERVAL '1 hour';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Cleaned % old trigger messages', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning trigger messages: %', SQLERRM;
    END;
    
    -- 5. Now safe to delete very old completed groups (6+ hours after completion)
    BEGIN
        DELETE FROM public.groups 
        WHERE status = 'completed'
        AND completed_at < NOW() - INTERVAL '6 hours';
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % old completed groups', cleanup_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error cleaning completed groups: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Safe cleanup completed at %', NOW();
END;
$$;

-- Step 5: Add completed_at column to groups table for tracking
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Step 6: Create trigger to set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_completed_at ON public.groups;
CREATE TRIGGER trigger_set_completed_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.set_completed_at();