-- Step 1: Fix the set_completed_at trigger to properly set the timestamp
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RAISE NOTICE 'set_completed_at trigger fired: OLD.status=%, NEW.status=%', OLD.status, NEW.status;
    
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        NEW.completed_at = NOW();
        RAISE NOTICE 'Setting completed_at to % for group %', NEW.completed_at, NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;

-- Step 2: Fix the add_to_outings_history trigger with better logging and error handling
CREATE OR REPLACE FUNCTION public.add_to_outings_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    inserted_count integer := 0;
BEGIN
    RAISE NOTICE 'add_to_outings_history trigger fired: OLD.status=%, NEW.status=%, bar_name=%, completed_at=%', 
        OLD.status, NEW.status, NEW.bar_name, NEW.completed_at;
    
    -- Vérifier si le groupe passe de 'confirmed' à 'completed'
    IF OLD.status = 'confirmed' AND NEW.status = 'completed' AND NEW.bar_name IS NOT NULL THEN
        -- Ajouter chaque participant à l'historique
        INSERT INTO public.user_outings_history (
            user_id,
            group_id,
            bar_name,
            bar_address,
            meeting_time,
            participants_count,
            bar_latitude,
            bar_longitude,
            bar_place_id
        )
        SELECT 
            gp.user_id,
            NEW.id,
            NEW.bar_name,
            NEW.bar_address,
            NEW.meeting_time,
            NEW.current_participants,
            NEW.bar_latitude,
            NEW.bar_longitude,
            NEW.bar_place_id
        FROM public.group_participants gp
        WHERE gp.group_id = NEW.id 
            AND gp.status = 'confirmed';
        
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RAISE NOTICE 'Inserted % entries into user_outings_history for group %', inserted_count, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Step 3: Create a manual repair function for missing history entries
CREATE OR REPLACE FUNCTION public.repair_missing_outings_history()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    repair_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting repair of missing outings history at %', NOW();
    
    -- Insert missing history entries for completed groups that have participants but no history
    INSERT INTO public.user_outings_history (
        user_id,
        group_id,
        bar_name,
        bar_address,
        meeting_time,
        participants_count,
        bar_latitude,
        bar_longitude,
        bar_place_id
    )
    SELECT DISTINCT
        gp.user_id,
        g.id,
        g.bar_name,
        g.bar_address,
        g.meeting_time,
        g.current_participants,
        g.bar_latitude,
        g.bar_longitude,
        g.bar_place_id
    FROM public.groups g
    JOIN public.group_participants gp ON gp.group_id = g.id
    WHERE g.status = 'completed'
        AND g.bar_name IS NOT NULL
        AND gp.status = 'confirmed'
        AND NOT EXISTS (
            SELECT 1 FROM public.user_outings_history uoh
            WHERE uoh.group_id = g.id AND uoh.user_id = gp.user_id
        );
    
    GET DIAGNOSTICS repair_count = ROW_COUNT;
    RAISE NOTICE 'Repaired % missing history entries', repair_count;
    
    RETURN repair_count;
END;
$function$;

-- Step 4: Fix existing data - Update completed groups without completed_at timestamp
UPDATE public.groups 
SET completed_at = created_at + INTERVAL '2 hours'  -- Assume 2 hours after creation as completion time
WHERE status = 'completed' 
    AND completed_at IS NULL
    AND bar_name IS NOT NULL;

-- Step 5: Run the repair function to generate missing history entries
SELECT public.repair_missing_outings_history();