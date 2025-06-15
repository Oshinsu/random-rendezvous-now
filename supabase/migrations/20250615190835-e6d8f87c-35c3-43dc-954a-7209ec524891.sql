
-- Supprimer les politiques existantes qui causent la récursion
DROP POLICY IF EXISTS "Users can view group participants" ON public.group_participants;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_participants;

-- Supprimer les politiques sur les groupes si elles existent
DROP POLICY IF EXISTS "Users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can update groups" ON public.groups;

-- Supprimer les politiques sur les messages si elles existent
DROP POLICY IF EXISTS "Users can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.group_messages;

-- Créer une fonction sécurisée pour vérifier l'appartenance à un groupe
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_uuid 
    AND user_id = user_uuid 
    AND status = 'confirmed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Créer une fonction pour vérifier si l'utilisateur peut voir un groupe
CREATE OR REPLACE FUNCTION public.can_view_group(group_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Permettre de voir les groupes en attente (pour pouvoir les rejoindre)
  -- ou les groupes où l'utilisateur est membre
  RETURN EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_uuid 
    AND (status = 'waiting' OR id IN (
      SELECT group_id FROM public.group_participants 
      WHERE user_id = auth.uid() AND status = 'confirmed'
    ))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Créer des politiques RLS simples sans récursion

-- Politiques pour group_participants
CREATE POLICY "Enable read for group members" 
  ON public.group_participants 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
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

-- Politiques pour groups
CREATE POLICY "Enable read for all authenticated users" 
  ON public.groups 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON public.groups 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Politiques pour group_messages
CREATE POLICY "Enable read for authenticated users" 
  ON public.group_messages 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for message sender" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for message sender" 
  ON public.group_messages 
  FOR UPDATE 
  USING (auth.uid() = user_id);
