
-- Activer RLS sur toutes les tables si ce n'est pas déjà fait
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_outings_history ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table groups
DROP POLICY IF EXISTS "Users can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can update groups" ON public.groups;

CREATE POLICY "Users can view all groups" 
  ON public.groups 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create groups" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group participants can update groups" 
  ON public.groups 
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = groups.id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  );

-- Politiques pour la table group_participants
DROP POLICY IF EXISTS "Users can view group participants" ON public.group_participants;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_participants;

CREATE POLICY "Users can view group participants" 
  ON public.group_participants 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join groups" 
  ON public.group_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" 
  ON public.group_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave groups" 
  ON public.group_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques pour la table group_messages
DROP POLICY IF EXISTS "Group members can read messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow system messages" ON public.group_messages;

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

CREATE POLICY "Allow system messages" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (is_system = true);

-- Politiques pour la table profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own outings history" ON public.user_outings_history;
DROP POLICY IF EXISTS "System can insert outings history" ON public.user_outings_history;

CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Politiques pour la table user_outings_history
CREATE POLICY "Users can view their own outings history" 
  ON public.user_outings_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert outings history" 
  ON public.user_outings_history 
  FOR INSERT 
  WITH CHECK (true);

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_group_participants_user_group ON public.group_participants(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_group_status ON public.group_participants(group_id, status);
CREATE INDEX IF NOT EXISTS idx_groups_status_location ON public.groups(status, latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_outings_history_user_created ON public.user_outings_history(user_id, created_at DESC);
