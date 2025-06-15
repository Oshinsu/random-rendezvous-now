
-- Supprimer toutes les politiques RLS existantes qui causent la récursion
DROP POLICY IF EXISTS "Enable read for group members" ON public.group_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.group_participants;
DROP POLICY IF EXISTS "Enable update for own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Enable delete for own participation" ON public.group_participants;

DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.groups;

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.group_messages;
DROP POLICY IF EXISTS "Enable insert for message sender" ON public.group_messages;
DROP POLICY IF EXISTS "Enable update for message sender" ON public.group_messages;

-- Créer des fonctions de sécurité pour éviter la récursion
CREATE OR REPLACE FUNCTION public.user_can_access_group_participants(target_group_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Permettre l'accès si l'utilisateur est authentifié
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_can_access_groups()
RETURNS BOOLEAN AS $$
BEGIN
  -- Permettre l'accès si l'utilisateur est authentifié
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Créer des politiques RLS non-récursives

-- Politiques pour group_participants
CREATE POLICY "Allow authenticated users to read group participants" 
  ON public.group_participants 
  FOR SELECT 
  USING (public.user_can_access_group_participants(group_id));

CREATE POLICY "Allow authenticated users to insert participants" 
  ON public.group_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND public.user_can_access_group_participants(group_id));

CREATE POLICY "Allow users to update their own participation" 
  ON public.group_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own participation" 
  ON public.group_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques pour groups
CREATE POLICY "Allow authenticated users to read groups" 
  ON public.groups 
  FOR SELECT 
  USING (public.user_can_access_groups());

CREATE POLICY "Allow authenticated users to create groups" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (public.user_can_access_groups());

CREATE POLICY "Allow authenticated users to update groups" 
  ON public.groups 
  FOR UPDATE 
  USING (public.user_can_access_groups());

-- Politiques pour group_messages
CREATE POLICY "Allow authenticated users to read messages" 
  ON public.group_messages 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to send messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own messages" 
  ON public.group_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);
