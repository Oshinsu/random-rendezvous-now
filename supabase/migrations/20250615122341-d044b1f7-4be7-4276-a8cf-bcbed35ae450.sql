
-- Modifier la fonction pour dissoudre les groupes 2 heures après qu'ils soient devenus complets
CREATE OR REPLACE FUNCTION dissolve_old_groups()
RETURNS void AS $$
BEGIN
  -- Supprimer les participants des groupes qui sont complets depuis plus de 2 heures
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '2 hours'
  );
  
  -- Supprimer les messages des groupes qui sont complets depuis plus de 2 heures
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '2 hours'
  );
  
  -- Supprimer les groupes qui sont complets depuis plus de 2 heures
  DELETE FROM public.groups 
  WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '2 hours';
  
  -- Log pour debug
  RAISE NOTICE 'Nettoyage automatique des groupes complets anciens effectué à %', NOW();
END;
$$ LANGUAGE plpgsql;
