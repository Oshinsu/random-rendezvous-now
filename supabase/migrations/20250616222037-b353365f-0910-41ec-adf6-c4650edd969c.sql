
-- Create trigger to automatically update group participant count and handle bar assignment
CREATE OR REPLACE FUNCTION public.handle_group_participant_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    current_count integer;
    group_info record;
BEGIN
    -- Get the group ID from either NEW or OLD record
    DECLARE group_uuid uuid;
    BEGIN
        group_uuid := COALESCE(NEW.group_id, OLD.group_id);
    END;
    
    -- Count current confirmed participants
    SELECT COUNT(*) INTO current_count
    FROM public.group_participants 
    WHERE group_id = group_uuid 
    AND status = 'confirmed';
    
    -- Get current group information
    SELECT * INTO group_info
    FROM public.groups 
    WHERE id = group_uuid;
    
    -- Update the group's participant count
    UPDATE public.groups 
    SET current_participants = current_count
    WHERE id = group_uuid;
    
    -- Handle group status changes and bar assignment
    IF current_count = 5 AND group_info.status = 'waiting' THEN
        -- Group is now full, change status to confirmed
        UPDATE public.groups 
        SET status = 'confirmed'
        WHERE id = group_uuid;
        
        -- Call automatic bar assignment function after a brief delay
        -- This will be handled by the edge function trigger
        
    ELSIF current_count < 5 AND group_info.status = 'confirmed' AND group_info.bar_name IS NULL THEN
        -- Group is no longer full and has no bar assigned, revert to waiting
        UPDATE public.groups 
        SET status = 'waiting'
        WHERE id = group_uuid;
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- Create trigger for INSERT and UPDATE on group_participants
DROP TRIGGER IF EXISTS trigger_group_participant_changes ON public.group_participants;
CREATE TRIGGER trigger_group_participant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.group_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_group_participant_changes();

-- Create function to call the auto-assign-bar edge function
CREATE OR REPLACE FUNCTION public.trigger_auto_bar_assignment()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only trigger when status changes from 'waiting' to 'confirmed' and no bar is assigned
    IF OLD.status = 'waiting' AND NEW.status = 'confirmed' AND NEW.bar_name IS NULL THEN
        -- Insert a job record that the edge function can pick up
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
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for group status changes
DROP TRIGGER IF EXISTS trigger_auto_bar_assignment ON public.groups;
CREATE TRIGGER trigger_auto_bar_assignment
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_auto_bar_assignment();
