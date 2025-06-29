
-- PLAN DE CORRECTION DES POLITIQUES RLS RÉCURSIVES
-- Étape 1: Supprimer toutes les politiques RLS problématiques et récursives

-- Supprimer toutes les politiques existantes sur group_participants
DROP POLICY IF EXISTS "authenticated_users_can_view_participants" ON public.group_participants;
DROP POLICY IF EXISTS "users_can_join_groups" ON public.group_participants;
DROP POLICY IF EXISTS "users_can_update_own_participation" ON public.group_participants;
DROP POLICY IF EXISTS "users_can_leave_groups" ON public.group_participants;
DROP POLICY IF EXISTS "Users can view participants of their groups only" ON public.group_participants;

-- Supprimer toutes les politiques existantes sur groups
DROP POLICY IF EXISTS "authenticated_users_can_view_groups" ON public.groups;
DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON public.groups;
DROP POLICY IF EXISTS "authenticated_users_can_update_groups" ON public.groups;

-- Supprimer toutes les politiques existantes sur group_messages
DROP POLICY IF EXISTS "group_members_can_read_messages" ON public.group_messages;
DROP POLICY IF EXISTS "group_members_can_send_messages" ON public.group_messages;
DROP POLICY IF EXISTS "system_can_send_messages" ON public.group_messages;

-- Étape 2: Créer des fonctions helper sécurisées pour éviter la récursion
CREATE OR REPLACE FUNCTION public.get_user_group_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT group_id 
    FROM public.group_participants 
    WHERE user_id = user_uuid 
    AND status = 'confirmed'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_user_in_group(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_uuid 
    AND user_id = user_uuid 
    AND status = 'confirmed'
  );
END;
$function$;

-- Étape 3: Créer des politiques RLS NON-RÉCURSIVES et sécurisées

-- POLITIQUES GROUPS - Lecture publique limitée, écriture authentifiée
CREATE POLICY "authenticated_users_can_view_groups_v2" 
  ON public.groups 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_create_groups_v2" 
  ON public.groups 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_update_groups_v2" 
  ON public.groups 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- POLITIQUES GROUP_PARTICIPANTS - Accès direct sans récursion
CREATE POLICY "authenticated_users_can_view_participants_v2" 
  ON public.group_participants 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_can_join_groups_v2" 
  ON public.group_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_participation_v2" 
  ON public.group_participants 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_leave_groups_v2" 
  ON public.group_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- POLITIQUES GROUP_MESSAGES - Utilisation des fonctions helper
CREATE POLICY "authenticated_users_can_read_group_messages_v2" 
  ON public.group_messages 
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL AND 
    public.is_user_in_group(group_id, auth.uid())
  );

CREATE POLICY "authenticated_users_can_send_messages_v2" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_user_in_group(group_id, auth.uid())
  );

CREATE POLICY "system_can_send_messages_v2" 
  ON public.group_messages 
  FOR INSERT 
  WITH CHECK (is_system = true);

-- Étape 4: Optimisation des index pour les nouvelles politiques
CREATE INDEX IF NOT EXISTS idx_group_participants_user_status_optimized 
  ON public.group_participants(user_id, status, group_id);

CREATE INDEX IF NOT EXISTS idx_group_participants_group_user_status 
  ON public.group_participants(group_id, user_id, status);
