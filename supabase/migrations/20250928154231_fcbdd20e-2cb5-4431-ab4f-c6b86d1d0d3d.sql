-- Add new group status for payment flow
ALTER TABLE public.groups 
ADD CONSTRAINT groups_status_check_ppu 
CHECK (status IN ('waiting', 'confirmed', 'completed', 'cancelled', 'awaiting_payment'));

-- Temporarily disable the constraint to add the new status
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_status_check;
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_status_check_ppu;

-- Recreate with new status
ALTER TABLE public.groups 
ADD CONSTRAINT groups_status_check 
CHECK (status IN ('waiting', 'confirmed', 'completed', 'cancelled', 'awaiting_payment'));

-- Update trigger to handle PPU mode
CREATE OR REPLACE FUNCTION public.handle_group_participant_changes_ppu()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count integer;
    group_info record;
    target_group_id uuid;
    existing_trigger_count integer;
    ppu_enabled boolean;
BEGIN
    -- Get the group ID from either NEW or OLD record
    target_group_id := COALESCE(NEW.group_id, OLD.group_id);
    
    -- Count current confirmed participants
    SELECT COUNT(*) INTO current_count
    FROM public.group_participants 
    WHERE group_id = target_group_id 
    AND status = 'confirmed';
    
    -- Get current group information
    SELECT * INTO group_info
    FROM public.groups 
    WHERE id = target_group_id;
    
    -- Update the group's participant count
    UPDATE public.groups 
    SET current_participants = current_count
    WHERE id = target_group_id;
    
    -- Check if PPU mode is enabled
    SELECT public.is_ppu_mode_enabled() INTO ppu_enabled;
    
    -- Handle group status changes
    IF current_count = 5 AND group_info.status = 'waiting' THEN
        
        IF ppu_enabled THEN
            -- PPU MODE: Change to awaiting_payment and initiate payment process
            UPDATE public.groups 
            SET status = 'awaiting_payment'
            WHERE id = target_group_id;
            
            -- Initiate group payment process
            BEGIN
                PERFORM public.initiate_group_payment(target_group_id);
                
                -- Insert payment notification message
                INSERT INTO public.group_messages (
                    group_id,
                    user_id,
                    message,
                    is_system
                ) VALUES (
                    target_group_id,
                    '00000000-0000-0000-0000-000000000000',
                    'Votre groupe est complet ! Chaque membre doit maintenant payer 0,99€ pour valider le groupe et accéder au bar assigné.',
                    true
                );
                
                RAISE NOTICE 'PPU payment initiated for group %', target_group_id;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Failed to initiate PPU payment for group %: %', target_group_id, SQLERRM;
                -- Revert to waiting status on payment initiation failure
                UPDATE public.groups 
                SET status = 'waiting'
                WHERE id = target_group_id;
            END;
            
        ELSE
            -- FREE MODE: Direct confirmation and bar assignment
            UPDATE public.groups 
            SET status = 'confirmed'
            WHERE id = target_group_id;
            
            -- Check for existing trigger messages
            SELECT COUNT(*) INTO existing_trigger_count
            FROM public.group_messages 
            WHERE group_id = target_group_id 
            AND message = 'AUTO_BAR_ASSIGNMENT_TRIGGER'
            AND is_system = true
            AND created_at > NOW() - INTERVAL '2 minutes';
            
            -- Only create trigger if none exists recently
            IF existing_trigger_count = 0 THEN
                INSERT INTO public.group_messages (
                    group_id,
                    user_id,
                    message,
                    is_system
                ) VALUES (
                    target_group_id,
                    '00000000-0000-0000-0000-000000000000',
                    'AUTO_BAR_ASSIGNMENT_TRIGGER',
                    true
                );
                
                RAISE NOTICE 'Free mode: Bar assignment trigger created for group %', target_group_id;
            END IF;
        END IF;
        
    ELSIF current_count < 5 AND group_info.status IN ('confirmed', 'awaiting_payment') AND group_info.bar_name IS NULL THEN
        -- Group is no longer full, revert to waiting
        UPDATE public.groups 
        SET status = 'waiting'
        WHERE id = target_group_id;
        
        -- Cancel any pending payments
        IF ppu_enabled THEN
            UPDATE public.group_payments 
            SET status = 'cancelled'
            WHERE group_id = target_group_id 
            AND status IN ('pending', 'processing');
        END IF;
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Replace the existing trigger with the new PPU-aware version
DROP TRIGGER IF EXISTS group_participant_changes_trigger ON public.group_participants;
CREATE TRIGGER group_participant_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.group_participants
    FOR EACH ROW EXECUTE FUNCTION public.handle_group_participant_changes_ppu();