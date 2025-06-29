
-- Corriger complètement la fonction de nettoyage avec DÉLAI MINIMUM de sécurité
CREATE OR REPLACE FUNCTION dissolve_old_groups()
RETURNS void AS $$
BEGIN
  -- 1. Supprimer les participants inactifs depuis 6 heures (seuil plus conservateur)
  DELETE FROM public.group_participants 
  WHERE last_seen < NOW() - INTERVAL '6 hours';
  
  -- 2. Identifier et supprimer les groupes en attente qui sont maintenant vides
  -- MAIS SEULEMENT après un délai minimum de 5 minutes
  DELETE FROM public.groups 
  WHERE status = 'waiting'
  AND current_participants = 0
  AND created_at < NOW() - INTERVAL '5 minutes' -- DÉLAI MINIMUM DE SÉCURITÉ
  AND id NOT IN (
    SELECT DISTINCT group_id 
    FROM public.group_participants 
    WHERE status = 'confirmed'
  );
  
  -- 3. Corriger automatiquement les compteurs des groupes restants
  UPDATE public.groups 
  SET current_participants = (
    SELECT COUNT(*) 
    FROM public.group_participants 
    WHERE group_id = groups.id 
    AND status = 'confirmed'
  )
  WHERE status IN ('waiting', 'confirmed');
  
  -- 4. Remettre en attente les groupes confirmés qui passent sous 5 participants
  UPDATE public.groups 
  SET status = 'waiting',
      bar_name = NULL,
      bar_address = NULL,
      meeting_time = NULL,
      bar_latitude = NULL,
      bar_longitude = NULL,
      bar_place_id = NULL
  WHERE status = 'confirmed'
  AND current_participants < 5;
  
  -- 5. Supprimer les groupes en attente très anciens (1 heure au lieu de plus court)
  -- SEULEMENT s'ils sont vides ET anciens
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'waiting'
    AND current_participants = 0
    AND created_at < NOW() - INTERVAL '1 hour'
  );
  
  DELETE FROM public.groups 
  WHERE status = 'waiting'
  AND current_participants = 0
  AND created_at < NOW() - INTERVAL '1 hour';
  
  -- 6. Supprimer les messages des groupes qui n'existent plus
  DELETE FROM public.group_messages 
  WHERE group_id NOT IN (SELECT id FROM public.groups);
  
  -- 7. Supprimer les groupes terminés (3h après meeting_time)
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  DELETE FROM public.groups 
  WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours';
  
  -- Log pour debug
  RAISE NOTICE 'Nettoyage sécurisé effectué à % - Délai minimum respecté', NOW();
END;
$$ LANGUAGE plpgsql;
