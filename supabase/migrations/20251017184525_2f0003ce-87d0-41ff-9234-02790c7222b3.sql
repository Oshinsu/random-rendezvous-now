-- Activer REPLICA IDENTITY FULL pour les tables critiques
-- Cela permet à Realtime de recevoir toutes les colonnes lors des UPDATE

ALTER TABLE public.groups REPLICA IDENTITY FULL;
ALTER TABLE public.group_participants REPLICA IDENTITY FULL;
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;

-- Vérifier que les tables sont bien dans la publication realtime
-- (normalement déjà fait, mais on s'assure)
DO $$
BEGIN
  -- Ajouter les tables à la publication si elles n'y sont pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'group_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  END IF;
END $$;