
-- Supprimer toutes les politiques RLS existantes pour éviter les conflits
DROP POLICY IF EXISTS "Allow authenticated users to read group participants" ON public.group_participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON public.group_participants;
DROP POLICY IF EXISTS "Allow users to update their own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Allow users to delete their own participation" ON public.group_participants;

DROP POLICY IF EXISTS "Allow authenticated users to read groups" ON public.groups;
DROP POLICY IF EXISTS "Allow authenticated users to create groups" ON public.groups;
DROP POLICY IF EXISTS "Allow authenticated users to update groups" ON public.groups;

DROP POLICY IF EXISTS "Allow authenticated users to read messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow users to send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow users to update their own messages" ON public.group_messages;

-- Supprimer les fonctions qui causent la récursion
DROP FUNCTION IF EXISTS public.user_can_access_group_participants(uuid);
DROP FUNCTION IF EXISTS public.user_can_access_groups();

-- Créer des politiques RLS simples et directes sans récursion

-- Politiques pour group_participants (simples et directes)
CREATE POLICY "Enable read for authenticated users on group_participants" 
  ON public.group_participants 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users on group_participants" 
  ON public.group_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own participation" 
  ON public.group_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for own participation" 
  ON public.group_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques pour groups (simples et directes)
CREATE POLICY "Enable read for authenticated users on groups" 
  ON public.groups 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users on groups" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users on groups" 
  ON public.groups 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Politiques pour group_messages (simples et directes)
CREATE POLICY "Enable read for authenticated users on group_messages" 
  ON public.group_messages 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for message sender on group_messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for message sender on group_messages" 
  ON public.group_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);
