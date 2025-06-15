
-- Mise à jour de sécurité corrective - ne créer que les politiques manquantes

-- Supprimer et recréer les politiques potentiellement obsolètes pour group_messages
DROP POLICY IF EXISTS "Group members can read messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow system messages" ON public.group_messages;

-- Recréer les politiques pour group_messages avec la bonne syntaxe
CREATE POLICY "Group members can read messages" 
  ON public.group_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = group_messages.group_id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  );

CREATE POLICY "Group members can send messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = group_messages.group_id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  );

-- Politique pour les messages système
CREATE POLICY "Allow system messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (is_system = true);

-- Créer les politiques manquantes pour les autres tables seulement si elles n'existent pas
DO $$
BEGIN
  -- Vérifier et créer les politiques pour group_participants
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_participants' AND policyname = 'Users can view group participants') THEN
    CREATE POLICY "Users can view group participants" 
      ON public.group_participants 
      FOR SELECT 
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_participants' AND policyname = 'Users can join groups') THEN
    CREATE POLICY "Users can join groups" 
      ON public.group_participants 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_participants' AND policyname = 'Users can update their participation') THEN
    CREATE POLICY "Users can update their participation" 
      ON public.group_participants 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'group_participants' AND policyname = 'Users can leave groups') THEN
    CREATE POLICY "Users can leave groups" 
      ON public.group_participants 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;

  -- Vérifier et créer les politiques pour groups
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Users can view all groups') THEN
    CREATE POLICY "Users can view all groups" 
      ON public.groups 
      FOR SELECT 
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Authenticated users can create groups') THEN
    CREATE POLICY "Authenticated users can create groups" 
      ON public.groups 
      FOR INSERT 
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Authenticated users can update groups') THEN
    CREATE POLICY "Authenticated users can update groups" 
      ON public.groups 
      FOR UPDATE 
      USING (auth.uid() IS NOT NULL);
  END IF;

  -- Vérifier et créer les politiques pour profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" 
      ON public.profiles 
      FOR SELECT 
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" 
      ON public.profiles 
      FOR UPDATE 
      USING (auth.uid() = id) 
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Vérifier et créer les politiques pour user_outings_history
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_outings_history' AND policyname = 'Users can view their own outings history') THEN
    CREATE POLICY "Users can view their own outings history" 
      ON public.user_outings_history 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_outings_history' AND policyname = 'System can insert outings history') THEN
    CREATE POLICY "System can insert outings history" 
      ON public.user_outings_history 
      FOR INSERT 
      WITH CHECK (true);
  END IF;

END $$;
