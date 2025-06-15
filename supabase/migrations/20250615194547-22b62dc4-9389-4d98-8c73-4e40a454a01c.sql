
-- Supprimer toutes les politiques existantes qui causent la récursion
DROP POLICY IF EXISTS "Enable read for authenticated users on group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users on group_participants" ON public.group_participants;
DROP POLICY IF EXISTS "Enable update for own participation" ON public.group_participants;
DROP POLICY IF EXISTS "Enable delete for own participation" ON public.group_participants;

DROP POLICY IF EXISTS "Enable read for authenticated users on groups" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users on groups" ON public.groups;
DROP POLICY IF EXISTS "Enable update for authenticated users on groups" ON public.groups;

DROP POLICY IF EXISTS "Enable read for authenticated users on group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Enable insert for message sender on group_messages" ON public.group_messages;
DROP POLICY IF EXISTS "Enable update for message sender on group_messages" ON public.group_messages;

-- Supprimer les fonctions qui pourraient causer des problèmes
DROP FUNCTION IF EXISTS public.user_can_access_group_participants(uuid);
DROP FUNCTION IF EXISTS public.user_can_access_groups();

-- Créer des politiques RLS très simples sans aucune récursion
CREATE POLICY "Simple read access for group_participants" 
  ON public.group_participants 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Simple insert for group_participants" 
  ON public.group_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Simple update for group_participants" 
  ON public.group_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Simple delete for group_participants" 
  ON public.group_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques simples pour groups
CREATE POLICY "Simple read access for groups" 
  ON public.groups 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Simple insert for groups" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Simple update for groups" 
  ON public.groups 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Politiques simples pour group_messages
CREATE POLICY "Simple read access for group_messages" 
  ON public.group_messages 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Simple insert for group_messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Simple update for group_messages" 
  ON public.group_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);
