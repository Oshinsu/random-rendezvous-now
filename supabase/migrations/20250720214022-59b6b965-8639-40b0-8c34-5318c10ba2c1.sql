
-- Corriger l'attribution automatique de bar - Appel à la fonction unifiée
CREATE OR REPLACE FUNCTION public.handle_group_participant_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    current_count integer;
    group_info record;
    target_group_id uuid;
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
    
    -- Handle group status changes and bar assignment
    IF current_count = 5 AND group_info.status = 'waiting' THEN
        -- Group is now full, change status to confirmed
        UPDATE public.groups 
        SET status = 'confirmed'
        WHERE id = target_group_id;
        
        -- Attribution automatique IMMÉDIATE du bar via la fonction unifiée
        BEGIN
            -- Appel à simple-auto-assign-bar (fonction unifiée)
            SELECT net.http_post(
                url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/simple-auto-assign-bar',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
                ),
                body := jsonb_build_object(
                    'group_id', target_group_id,
                    'latitude', group_info.latitude,
                    'longitude', group_info.longitude
                )
            );
            
            -- Log the result for debugging
            RAISE NOTICE 'Bar assignment triggered for group % via unified function at %', target_group_id, now();
            
        EXCEPTION WHEN OTHERS THEN
            -- En cas d'erreur, envoyer un message système de fallback
            INSERT INTO public.group_messages (
                group_id,
                user_id,
                message,
                is_system
            ) VALUES (
                target_group_id,
                '00000000-0000-0000-0000-000000000000',
                '🍺 Votre groupe est complet ! Attribution du bar en cours...',
                true
            );
            
            RAISE NOTICE 'Bar assignment fallback for group %: %', target_group_id, SQLERRM;
        END;
        
    ELSIF current_count < 5 AND group_info.status = 'confirmed' AND group_info.bar_name IS NULL THEN
        -- Group is no longer full and has no bar assigned, revert to waiting
        UPDATE public.groups 
        SET status = 'waiting'
        WHERE id = target_group_id;
    END IF;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;
