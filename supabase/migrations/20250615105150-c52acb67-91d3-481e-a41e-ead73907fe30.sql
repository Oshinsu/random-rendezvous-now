
-- Fonction pour dissoudre automatiquement les groupes anciens (plus de 2 heures)
CREATE OR REPLACE FUNCTION dissolve_old_groups()
RETURNS void AS $$
BEGIN
  -- Supprimer les participants des groupes anciens
  DELETE FROM public.group_participants 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE created_at < NOW() - INTERVAL '2 hours'
    AND status IN ('waiting', 'confirmed')
  );
  
  -- Supprimer les messages des groupes anciens
  DELETE FROM public.group_messages 
  WHERE group_id IN (
    SELECT id FROM public.groups 
    WHERE created_at < NOW() - INTERVAL '2 hours'
    AND status IN ('waiting', 'confirmed')
  );
  
  -- Supprimer les groupes anciens
  DELETE FROM public.groups 
  WHERE created_at < NOW() - INTERVAL '2 hours'
  AND status IN ('waiting', 'confirmed');
  
  -- Log pour debug
  RAISE NOTICE 'Nettoyage automatique des groupes anciens effectué à %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Ajouter une colonne last_seen pour tracker la dernière activité des participants
ALTER TABLE public.group_participants 
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Fonction pour mettre à jour le last_seen quand un utilisateur est actif
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

-- Créer un trigger pour mettre à jour last_seen quand un message est envoyé
DROP TRIGGER IF EXISTS update_last_seen_on_message ON public.group_messages;
CREATE TRIGGER update_last_seen_on_message
  AFTER INSERT ON public.group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_last_seen();

-- Fonction pour nettoyer automatiquement lors des opérations sur les groupes
CREATE OR REPLACE FUNCTION auto_cleanup_on_group_operations()
RETURNS trigger AS $$
BEGIN
  -- Appeler le nettoyage automatique à chaque opération sur les groupes
  PERFORM dissolve_old_groups();
  
  -- Retourner l'enregistrement approprié selon l'opération
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer des triggers pour nettoyer automatiquement lors des opérations
DROP TRIGGER IF EXISTS auto_cleanup_on_group_insert ON public.groups;
CREATE TRIGGER auto_cleanup_on_group_insert
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_cleanup_on_group_operations();

DROP TRIGGER IF EXISTS auto_cleanup_on_participant_insert ON public.group_participants;
CREATE TRIGGER auto_cleanup_on_participant_insert
  AFTER INSERT ON public.group_participants
  FOR EACH ROW
  EXECUTE FUNCTION auto_cleanup_on_group_operations();
