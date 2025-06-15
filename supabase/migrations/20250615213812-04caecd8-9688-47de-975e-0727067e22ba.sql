
-- Modifier la fonction pour avoir des délais plus réalistes
CREATE OR REPLACE FUNCTION dissolve_old_groups()
RETURNS void AS $$
BEGIN
  -- 1. Supprimer les participants inactifs depuis plus de 60 minutes dans les groupes en attente
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '60 minutes'
  )
  AND last_seen < NOW() - INTERVAL '60 minutes';
  
  -- 2. Supprimer les messages des groupes en attente anciens (60 minutes)
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '60 minutes'
  );
  
  -- 3. Supprimer les groupes en attente anciens (60 minutes) s'ils sont vides
  DELETE FROM public.groups 
  WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '60 minutes'
    AND current_participants = 0;
  
  -- 4. Supprimer les participants des groupes confirmés mais sans bar (30 minutes)
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND bar_name IS NULL
    AND created_at < NOW() - INTERVAL '30 minutes'
  );
  
  -- 5. Supprimer les messages des groupes confirmés sans bar anciens
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND bar_name IS NULL
    AND created_at < NOW() - INTERVAL '30 minutes'
  );
  
  -- 6. Supprimer les groupes confirmés sans bar anciens
  DELETE FROM public.groups 
  WHERE status = 'confirmed'
    AND bar_name IS NULL
    AND created_at < NOW() - INTERVAL '30 minutes';
  
  -- 7. Supprimer les participants des groupes avec bar après la soirée (3 heures post meeting_time)
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  -- 8. Supprimer les messages des groupes avec bar terminés
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours'
  );
  
  -- 9. Supprimer les groupes avec bar terminés
  DELETE FROM public.groups 
  WHERE status = 'confirmed'
    AND meeting_time IS NOT NULL
    AND meeting_time < NOW() - INTERVAL '3 hours';
  
  -- Log pour debug
  RAISE NOTICE 'Nettoyage automatique avec délais réalistes effectué à %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Modifier aussi la fonction de nettoyage basée sur last_seen pour être moins agressive
CREATE OR REPLACE FUNCTION update_participant_last_seen()
RETURNS trigger AS $$
BEGIN
  -- Mettre à jour last_seen pour l'utilisateur qui envoie un message
  UPDATE public.group_participants 
  SET last_seen = now()
  WHERE group_id = NEW.group_id 
  AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
