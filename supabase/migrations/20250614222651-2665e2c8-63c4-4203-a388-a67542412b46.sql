
-- Supprimer les anciennes politiques s'elles existent
DROP POLICY IF EXISTS "Group members can read messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;

-- Recréer les politiques avec la bonne syntaxe
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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id_created_at ON public.group_messages(group_id, created_at DESC);
