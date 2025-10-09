-- Simplify to only 5 essential segments

-- Delete old segments that are no longer needed
DELETE FROM public.crm_user_segment_memberships 
WHERE segment_id IN (
  SELECT id FROM public.crm_user_segments 
  WHERE segment_key NOT IN ('active', 'new_users', 'zombie_users', 'dormant', 'churn_risk')
);

DELETE FROM public.crm_user_segments 
WHERE segment_key NOT IN ('active', 'new_users', 'zombie_users', 'dormant', 'churn_risk');

-- Update existing segments with better descriptions
UPDATE public.crm_user_segments 
SET 
  segment_name = 'Actifs',
  description = 'Utilisateurs actifs (connectés récemment + sorties)',
  color = '#10b981'
WHERE segment_key = 'active';

UPDATE public.crm_user_segments 
SET 
  segment_name = 'Nouveaux',
  description = 'Nouveaux inscrits (< 7 jours)',
  color = '#3b82f6'
WHERE segment_key = 'new_users';

UPDATE public.crm_user_segments 
SET 
  segment_name = 'Zombies',
  description = 'Jamais connectés après 14+ jours',
  color = '#6b7280'
WHERE segment_key = 'zombie_users';

UPDATE public.crm_user_segments 
SET 
  segment_name = 'Dormants',
  description = 'Inactifs depuis 30+ jours',
  color = '#f59e0b'
WHERE segment_key = 'dormant';

UPDATE public.crm_user_segments 
SET 
  segment_name = 'Risque Critique',
  description = 'Risque de churn élevé',
  color = '#ef4444'
WHERE segment_key = 'churn_risk';

-- Simplify segment assignment function to handle only 5 segments
CREATE OR REPLACE FUNCTION public.assign_user_segments(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    health_record RECORD;
BEGIN
    SELECT * INTO health_record
    FROM public.crm_user_health
    WHERE user_id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    DELETE FROM public.crm_user_segment_memberships
    WHERE user_id = target_user_id;
    
    -- Priority 1: Zombies (never logged in after 14+ days) - EXCLUSIVE
    IF health_record.never_logged_in AND health_record.days_since_signup > 14 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'zombie_users';
        RETURN;
    END IF;
    
    -- Priority 2: New users (< 7 days)
    IF health_record.days_since_signup <= 7 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'new_users';
    END IF;
    
    -- Priority 3: Active (logged in recently + has outings)
    IF health_record.days_since_last_login IS NOT NULL 
       AND health_record.days_since_last_login <= 14 
       AND health_record.total_outings >= 1 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'active';
    END IF;
    
    -- Priority 4: Dormant (inactive 30+ days)
    IF health_record.days_since_last_activity IS NOT NULL 
       AND health_record.days_since_last_activity > 30 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'dormant';
    END IF;
    
    -- Priority 5: Churn Risk (critical health score or high risk)
    IF health_record.churn_risk = 'critical' OR health_record.health_score < 30 THEN
        INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
        SELECT target_user_id, id FROM public.crm_user_segments WHERE segment_key = 'churn_risk';
    END IF;
END;
$$;