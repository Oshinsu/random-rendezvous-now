
-- Corriger la fonction de nettoyage selon la logique métier réelle
CREATE OR REPLACE FUNCTION dissolve_old_groups()
RETURNS void AS $$
BEGIN
  -- 1. Nettoyer seulement les participants vraiment inactifs des groupes en attente (last_seen très ancien)
  -- Mais ne pas supprimer le groupe lui-même - il doit pouvoir attendre indéfiniment
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'waiting'
  )
  AND last_seen < NOW() - INTERVAL '24 hours'; -- Participants inactifs depuis 24h
  
  -- 2. Corriger automatiquement le compteur des groupes en attente après nettoyage des participants
  UPDATE public.groups 
  SET current_participants = (
    SELECT COUNT(*) 
    FROM public.group_participants 
    WHERE group_id = groups.id 
    AND status = 'confirmed'
  )
  WHERE status = 'waiting';
  
  -- 3. PAS de nettoyage des groupes confirmés sans bar car cela NE PEUT PAS EXISTER
  -- Si un groupe est confirmé, il DOIT avoir un bar assigné
  
  -- 4. Supprimer les participants des groupes terminés (3h après meeting_time)
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  -- 5. Supprimer les messages des groupes terminés
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  -- 6. Supprimer les groupes terminés (3h après meeting_time)
  DELETE FROM public.groups 
  WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours';
  
  -- Log pour debug
  RAISE NOTICE 'Nettoyage automatique corrigé effectué à %', NOW();
END;
$$ LANGUAGE plpgsql;
