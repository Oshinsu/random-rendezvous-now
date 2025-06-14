
-- Création de la table des groupes
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'full', 'confirmed', 'completed', 'cancelled')),
  bar_name TEXT,
  bar_address TEXT,
  meeting_time TIMESTAMPTZ,
  max_participants INTEGER NOT NULL DEFAULT 5,
  current_participants INTEGER NOT NULL DEFAULT 0
);

-- Création de la table des participants aux groupes
CREATE TABLE public.group_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  UNIQUE(group_id, user_id)
);

-- Activation de RLS pour les groupes
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir tous les groupes
CREATE POLICY "Tous les utilisateurs peuvent voir les groupes"
  ON public.groups FOR SELECT
  USING (true);

-- Politique : Les utilisateurs peuvent créer des groupes
CREATE POLICY "Les utilisateurs peuvent créer des groupes"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Politique : Les utilisateurs peuvent mettre à jour les groupes
CREATE POLICY "Les utilisateurs peuvent mettre à jour les groupes"
  ON public.groups FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Activation de RLS pour les participants
ALTER TABLE public.group_participants ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir tous les participants
CREATE POLICY "Tous les utilisateurs peuvent voir les participants"
  ON public.group_participants FOR SELECT
  USING (true);

-- Politique : Les utilisateurs peuvent rejoindre des groupes
CREATE POLICY "Les utilisateurs peuvent rejoindre des groupes"
  ON public.group_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent quitter leurs groupes
CREATE POLICY "Les utilisateurs peuvent quitter leurs groupes"
  ON public.group_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leur participation
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur participation"
  ON public.group_participants FOR UPDATE
  USING (auth.uid() = user_id);
