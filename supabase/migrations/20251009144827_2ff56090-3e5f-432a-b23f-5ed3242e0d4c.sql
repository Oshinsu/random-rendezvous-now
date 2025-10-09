-- ====================================
-- ÉTAPE 1: Corriger assign_user_segments
-- ====================================

CREATE OR REPLACE FUNCTION public.assign_user_segments(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_health RECORD;
    segment_rec RECORD;
    days_inactive INTEGER;
BEGIN
    -- Get user health data
    SELECT * INTO user_health FROM public.crm_user_health WHERE user_id = target_user_id;
    
    IF user_health IS NULL THEN
        RETURN;
    END IF;
    
    -- Handle NULL days_since_last_activity (treat as very long inactivity)
    days_inactive := COALESCE(user_health.days_since_last_activity, 999);
    
    -- Clear existing segment memberships
    DELETE FROM public.crm_user_segment_memberships WHERE user_id = target_user_id;
    
    -- Priority-based segment assignment (only ONE segment per user)
    FOR segment_rec IN SELECT * FROM public.crm_user_segments ORDER BY segment_key LOOP
        
        -- 1. Super Users (highest priority): ≥5 outings + health ≥80
        IF segment_rec.segment_key = 'super_users' AND 
           user_health.total_outings >= 5 AND 
           user_health.health_score >= 80 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
            RETURN;
        END IF;
        
        -- 2. Active Users: 2-4 outings + recent activity (≤14 days)
        IF segment_rec.segment_key = 'active' AND 
           user_health.total_outings BETWEEN 2 AND 4 AND
           days_inactive <= 14 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
            RETURN;
        END IF;
        
        -- 3. One-Timer: Exactly 1 outing
        IF segment_rec.segment_key = 'one_timer' AND 
           user_health.total_outings = 1 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
            RETURN;
        END IF;
        
        -- 4. Churn Risk: health < 30 OR inactive 30+ days
        IF segment_rec.segment_key = 'churn_risk' AND 
           (user_health.health_score < 30 OR days_inactive >= 30) THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
            RETURN;
        END IF;
        
        -- 5. Dormant: 1+ outing but inactive 14+ days
        IF segment_rec.segment_key = 'dormant' AND 
           user_health.total_outings >= 1 AND
           days_inactive > 14 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
            RETURN;
        END IF;
        
        -- 6. New Users (lowest priority): ≤7 days since signup, 0 outings
        IF segment_rec.segment_key = 'new_users' AND 
           user_health.days_since_signup <= 7 AND
           user_health.total_outings = 0 THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, segment_rec.id);
            RETURN;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'User % did not match any segment', target_user_id;
END;
$function$;

-- ====================================
-- ÉTAPE 2: Créer update_user_lifecycle_stage
-- ====================================

CREATE OR REPLACE FUNCTION public.update_user_lifecycle_stage(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_health RECORD;
    target_stage_id UUID;
    current_stage RECORD;
    days_inactive INTEGER;
BEGIN
    -- Get user health data
    SELECT * INTO user_health FROM public.crm_user_health WHERE user_id = target_user_id;
    
    IF user_health IS NULL THEN
        RETURN;
    END IF;
    
    -- Handle NULL days_since_last_activity
    days_inactive := COALESCE(user_health.days_since_last_activity, 999);
    
    -- Determine lifecycle stage based on user behavior
    IF days_inactive >= 60 THEN
        SELECT id INTO target_stage_id FROM public.crm_lifecycle_stages WHERE stage_key = 'churned';
    ELSIF days_inactive >= 30 THEN
        SELECT id INTO target_stage_id FROM public.crm_lifecycle_stages WHERE stage_key = 'at_risk';
    ELSIF user_health.total_outings >= 3 THEN
        SELECT id INTO target_stage_id FROM public.crm_lifecycle_stages WHERE stage_key = 'regular';
    ELSIF user_health.total_outings >= 1 THEN
        SELECT id INTO target_stage_id FROM public.crm_lifecycle_stages WHERE stage_key = 'first_outing';
    ELSIF user_health.total_groups >= 1 THEN
        SELECT id INTO target_stage_id FROM public.crm_lifecycle_stages WHERE stage_key = 'activated';
    ELSE
        SELECT id INTO target_stage_id FROM public.crm_lifecycle_stages WHERE stage_key = 'signup';
    END IF;
    
    -- Check current lifecycle stage
    SELECT * INTO current_stage
    FROM public.crm_user_lifecycle
    WHERE user_id = target_user_id AND is_current = true;
    
    -- Only update if stage changed
    IF current_stage IS NULL OR current_stage.stage_id != target_stage_id THEN
        UPDATE public.crm_user_lifecycle
        SET is_current = false, exited_at = NOW()
        WHERE user_id = target_user_id AND is_current = true;
        
        INSERT INTO public.crm_user_lifecycle (user_id, stage_id, is_current, entered_at)
        VALUES (target_user_id, target_stage_id, true, NOW());
    END IF;
END;
$function$;

-- ====================================
-- ÉTAPE 3: Créer trigger automatique
-- ====================================

CREATE OR REPLACE FUNCTION public.trigger_crm_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    PERFORM public.assign_user_segments(NEW.user_id);
    PERFORM public.update_user_lifecycle_stage(NEW.user_id);
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS assign_crm_after_health ON public.crm_user_health;

CREATE TRIGGER assign_crm_after_health
    AFTER INSERT OR UPDATE ON public.crm_user_health
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_crm_assignments();

-- ====================================
-- ÉTAPE 4: Remplir toutes les tables CRM
-- ====================================

DO $$
DECLARE
    user_rec RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    FOR user_rec IN SELECT user_id FROM public.crm_user_health LOOP
        BEGIN
            PERFORM public.assign_user_segments(user_rec.user_id);
            PERFORM public.update_user_lifecycle_stage(user_rec.user_id);
            success_count := success_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error for user %: %', user_rec.user_id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'CRM assignment complete: % success, % errors', success_count, error_count;
END $$;