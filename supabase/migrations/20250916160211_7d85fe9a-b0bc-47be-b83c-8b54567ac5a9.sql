-- ========================================
-- CORRECTION DES TRIGGERS MAL CONFIGURÉS
-- ========================================

-- ÉTAPE 1: Corriger le trigger add_to_outings_history (actuellement mal configuré)
-- Il doit se déclencher sur UPDATE, pas DELETE
DROP TRIGGER IF EXISTS tg_add_to_outings_history ON public.groups;

CREATE TRIGGER tg_add_to_outings_history
    AFTER UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.add_to_outings_history();

-- ÉTAPE 3: Améliorer la fonction delete_user_account pour être complète
CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    deleted_count integer := 0;
BEGIN
    -- Verify that the requesting user is deleting their own account
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'You can only delete your own account';
    END IF;
    
    -- NOUVEAU: Supprimer les groupes créés par l'utilisateur (s'ils sont vides)
    DELETE FROM public.groups 
    WHERE created_by_user_id = target_user_id 
    AND current_participants = 0 
    AND status IN ('waiting', 'cancelled');
    
    -- NOUVEAU: Supprimer les messages système liés aux groupes de l'utilisateur
    DELETE FROM public.group_messages 
    WHERE is_system = true 
    AND group_id IN (
        SELECT group_id FROM public.group_participants WHERE user_id = target_user_id
    );
    
    -- Delete user's group participations
    DELETE FROM public.group_participants WHERE user_id = target_user_id;
    
    -- Delete user's group messages
    DELETE FROM public.group_messages WHERE user_id = target_user_id;
    
    -- Delete user's outings history
    DELETE FROM public.user_outings_history WHERE user_id = target_user_id;
    
    -- Delete user's email preferences
    DELETE FROM public.user_email_preferences WHERE user_id = target_user_id;
    
    -- Delete user's roles
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Delete user's profile
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- Log the account deletion for audit purposes
    INSERT INTO public.admin_audit_log (
        admin_user_id,
        action_type,
        table_name,
        record_id,
        metadata
    ) VALUES (
        target_user_id,
        'DELETE_ACCOUNT',
        'profiles',
        target_user_id,
        json_build_object(
            'timestamp', now(),
            'self_deletion', true,
            'complete_cleanup', true
        )
    );
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete account: %', SQLERRM;
END;
$function$;

-- ÉTAPE 4: Renforcer check_user_participation_limit avec validation stricte
CREATE OR REPLACE FUNCTION public.check_user_participation_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    active_groups_count integer;
    scheduled_groups_count integer;
BEGIN
    -- Compter les groupes actifs (waiting/confirmed)
    SELECT COUNT(*) INTO active_groups_count
    FROM public.group_participants gp
    JOIN public.groups g ON gp.group_id = g.id
    WHERE gp.user_id = user_uuid 
    AND gp.status = 'confirmed'
    AND g.status IN ('waiting', 'confirmed');
    
    -- Compter les groupes planifiés à venir
    SELECT COUNT(*) INTO scheduled_groups_count
    FROM public.group_participants gp
    JOIN public.groups g ON gp.group_id = g.id
    WHERE gp.user_id = user_uuid 
    AND gp.status = 'confirmed'
    AND g.is_scheduled = true
    AND g.scheduled_for > NOW()
    AND g.status = 'waiting';
    
    -- Autoriser maximum 1 groupe actif + 2 groupes planifiés
    RETURN (active_groups_count = 0 AND scheduled_groups_count <= 2);
END;
$function$;

-- ÉTAPE 5: Ajouter validation stricte des participants
CREATE OR REPLACE FUNCTION public.validate_participant_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Validation stricte de la limite de participation
    IF NOT public.check_user_participation_limit(NEW.user_id) THEN
        RAISE EXCEPTION 'User has reached the participation limit (1 active group + max 2 scheduled groups)';
    END IF;
    
    -- Valider les coordonnées si présentes
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        IF NOT public.validate_coordinates_strict(NEW.latitude, NEW.longitude) THEN
            RAISE EXCEPTION 'Invalid coordinates provided';
        END IF;
    END IF;
    
    -- Empêcher les doublons dans le même groupe
    IF EXISTS (
        SELECT 1 FROM public.group_participants 
        WHERE group_id = NEW.group_id 
        AND user_id = NEW.user_id 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'User is already in this group';
    END IF;
    
    RETURN NEW;
END;
$function$;