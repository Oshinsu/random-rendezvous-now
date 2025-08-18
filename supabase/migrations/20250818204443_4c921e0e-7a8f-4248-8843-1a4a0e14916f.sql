-- Nettoyer les politiques RLS dupliquées sur group_participants
-- Supprimer les anciennes politiques françaises/anglaises, garder uniquement les _v2

-- group_participants: supprimer les doublons
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur participation" ON public.group_participants;
DROP POLICY IF EXISTS "Les utilisateurs peuvent quitter leurs groupes" ON public.group_participants;
DROP POLICY IF EXISTS "Les utilisateurs peuvent rejoindre des groupes" ON public.group_participants;
DROP POLICY IF EXISTS "Tous les utilisateurs peuvent voir les participants" ON public.group_participants;

DROP POLICY IF EXISTS "Users can join groups with restrictions" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave their own groups only" ON public.group_participants;
DROP POLICY IF EXISTS "Users can update their own participation only" ON public.group_participants;

-- groups: supprimer les doublons
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des groupes" ON public.groups;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour les groupes" ON public.groups;

-- group_messages: supprimer les doublons
DROP POLICY IF EXISTS "Group members can read group messages only" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages with validation" ON public.group_messages;
DROP POLICY IF EXISTS "System can send system messages" ON public.group_messages;

-- profiles: supprimer les doublons
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil." ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil." ON public.profiles;
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;