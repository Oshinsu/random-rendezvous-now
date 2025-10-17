-- Étape 1 : Créer le segment "Zombie Users" manquant
INSERT INTO public.crm_user_segments (segment_key, segment_name, description, color, criteria)
VALUES (
  'zombie_users',
  '🧟 Zombies',
  'Utilisateurs jamais connectés depuis plus de 14 jours',
  '#9ca3af',
  '{"never_logged_in": true, "days_since_signup_min": 14}'::jsonb
)
ON CONFLICT (segment_key) DO NOTHING;

-- Étape 2 : Créer le cron job pour calcul automatique horaire
SELECT cron.schedule(
  'calculate-crm-health-hourly',
  '5 * * * *', -- Toutes les heures à :05
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/calculate-all-health-scores',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- Étape 3 : Corriger la fonction assign_user_segments avec priorités claires
CREATE OR REPLACE FUNCTION public.assign_user_segments(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    health_record RECORD;
    zombie_segment_id UUID;
    new_users_segment_id UUID;
    active_segment_id UUID;
    dormant_segment_id UUID;
    churn_segment_id UUID;
BEGIN
    -- Récupérer les données de santé de l'utilisateur
    SELECT * INTO health_record
    FROM public.crm_user_health
    WHERE user_id = target_user_id;
    
    IF health_record IS NULL THEN
        RAISE NOTICE 'No health record found for user %', target_user_id;
        RETURN;
    END IF;
    
    -- Récupérer les IDs des segments
    SELECT id INTO zombie_segment_id FROM public.crm_user_segments WHERE segment_key = 'zombie_users';
    SELECT id INTO new_users_segment_id FROM public.crm_user_segments WHERE segment_key = 'new_users';
    SELECT id INTO active_segment_id FROM public.crm_user_segments WHERE segment_key = 'active';
    SELECT id INTO dormant_segment_id FROM public.crm_user_segments WHERE segment_key = 'dormant';
    SELECT id INTO churn_segment_id FROM public.crm_user_segments WHERE segment_key = 'churn_risk';
    
    -- Supprimer toutes les appartenances actuelles
    DELETE FROM public.crm_user_segment_memberships WHERE user_id = target_user_id;
    
    -- PRIORITÉ 1 : Zombies (jamais connectés + anciens) - EXCLUSIF
    IF health_record.never_logged_in = true AND health_record.days_since_signup > 14 THEN
        IF zombie_segment_id IS NOT NULL THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, zombie_segment_id);
            RAISE NOTICE 'Assigned user % to ZOMBIE segment', target_user_id;
        END IF;
        RETURN; -- Sortie immédiate pour les zombies
    END IF;
    
    -- PRIORITÉ 2 : Nouveaux utilisateurs (≤ 7 jours)
    IF health_record.days_since_signup <= 7 THEN
        IF new_users_segment_id IS NOT NULL THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, new_users_segment_id);
            RAISE NOTICE 'Assigned user % to NEW USERS segment', target_user_id;
        END IF;
    END IF;
    
    -- PRIORITÉ 3 : Actifs (connectés récemment OU ont fait des sorties)
    IF (health_record.days_since_last_login IS NOT NULL AND health_record.days_since_last_login <= 30) 
       OR health_record.total_outings >= 1 THEN
        IF active_segment_id IS NOT NULL THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, active_segment_id);
            RAISE NOTICE 'Assigned user % to ACTIVE segment', target_user_id;
        END IF;
    END IF;
    
    -- PRIORITÉ 4 : Dormants (pas connectés depuis 30+ jours ET aucune sortie)
    IF (health_record.days_since_last_login IS NULL OR health_record.days_since_last_login > 30)
       AND health_record.total_outings = 0 
       AND health_record.never_logged_in = false THEN
        IF dormant_segment_id IS NOT NULL THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, dormant_segment_id);
            RAISE NOTICE 'Assigned user % to DORMANT segment', target_user_id;
        END IF;
    END IF;
    
    -- PRIORITÉ 5 : Churn Risk (risque critique OU score < 30)
    IF health_record.churn_risk = 'critical' OR health_record.health_score < 30 THEN
        IF churn_segment_id IS NOT NULL THEN
            INSERT INTO public.crm_user_segment_memberships (user_id, segment_id)
            VALUES (target_user_id, churn_segment_id);
            RAISE NOTICE 'Assigned user % to CHURN RISK segment', target_user_id;
        END IF;
    END IF;
    
    RAISE NOTICE 'Segment assignment completed for user %', target_user_id;
END;
$$;

-- Validation : Vérifier que le cron job est créé
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'calculate-crm-health-hourly') THEN
        RAISE NOTICE '✅ Cron job "calculate-crm-health-hourly" créé avec succès';
    ELSE
        RAISE WARNING '⚠️ Le cron job n''a pas été créé';
    END IF;
END $$;