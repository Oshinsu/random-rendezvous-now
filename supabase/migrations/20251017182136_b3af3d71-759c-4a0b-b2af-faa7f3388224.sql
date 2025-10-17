-- ============================================
-- FORCE CONFIRM FEATURE - Migration Corrigée
-- Permet aux membres d'un groupe incomplet (3-4) de voter pour confirmer et partir
-- ============================================

-- 1. TABLE DES VOTES
CREATE TABLE IF NOT EXISTS public.group_force_confirm_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Index optimisés (sans prédicat immutable)
CREATE INDEX idx_force_confirm_votes_group ON public.group_force_confirm_votes(group_id);
CREATE INDEX idx_force_confirm_votes_voted_at ON public.group_force_confirm_votes(voted_at);

-- 2. ENABLE RLS
ALTER TABLE public.group_force_confirm_votes ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
-- Membres peuvent voter dans leur groupe
CREATE POLICY "members_can_vote_force_confirm"
ON public.group_force_confirm_votes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_force_confirm_votes.group_id 
    AND user_id = auth.uid()
    AND status = 'confirmed'
  )
);

-- Membres peuvent voir les votes de leur groupe
CREATE POLICY "members_can_view_votes"
ON public.group_force_confirm_votes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_force_confirm_votes.group_id 
    AND user_id = auth.uid()
    AND status = 'confirmed'
  )
);

-- Admins peuvent tout voir
CREATE POLICY "admins_can_view_all_votes"
ON public.group_force_confirm_votes
FOR SELECT
TO authenticated
USING (is_admin_user());

-- 4. FONCTION RPC PRINCIPALE
CREATE OR REPLACE FUNCTION public.force_confirm_incomplete_group(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group RECORD;
  v_votes_count INTEGER;
  v_current_participants INTEGER;
  v_vote_exists BOOLEAN;
BEGIN
  -- Récupérer les infos du groupe
  SELECT * INTO v_group
  FROM public.groups
  WHERE id = p_group_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group not found');
  END IF;

  -- Validations
  IF v_group.status != 'waiting' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group must be in waiting status');
  END IF;

  IF v_group.bar_name IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group already has a bar assigned');
  END IF;

  IF v_group.current_participants < 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Minimum 3 participants required');
  END IF;

  IF v_group.current_participants >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group is already full');
  END IF;

  -- Vérifier que l'utilisateur est membre
  IF NOT EXISTS (
    SELECT 1 FROM public.group_participants
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND status = 'confirmed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is not a member of this group');
  END IF;

  -- Vérifier si l'utilisateur a déjà voté
  SELECT EXISTS (
    SELECT 1 FROM public.group_force_confirm_votes
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND voted_at > NOW() - INTERVAL '1 hour'
  ) INTO v_vote_exists;

  IF v_vote_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'User has already voted');
  END IF;

  -- Nettoyer les votes expirés (> 1 heure)
  DELETE FROM public.group_force_confirm_votes
  WHERE group_id = p_group_id
  AND voted_at <= NOW() - INTERVAL '1 hour';

  -- Insérer le vote
  INSERT INTO public.group_force_confirm_votes (group_id, user_id)
  VALUES (p_group_id, p_user_id);

  -- Compter les votes valides
  SELECT COUNT(*) INTO v_votes_count
  FROM public.group_force_confirm_votes
  WHERE group_id = p_group_id
  AND voted_at > NOW() - INTERVAL '1 hour';

  -- Récupérer le nombre de participants actuels
  SELECT current_participants INTO v_current_participants
  FROM public.groups
  WHERE id = p_group_id;

  -- Vérifier l'unanimité
  IF v_votes_count >= v_current_participants THEN
    -- Confirmation forcée : changer le statut
    UPDATE public.groups
    SET status = 'confirmed'
    WHERE id = p_group_id;

    -- Message système dans le chat
    INSERT INTO public.group_messages (group_id, user_id, message, is_system)
    VALUES (
      p_group_id,
      '00000000-0000-0000-0000-000000000000',
      format('🎉 Confirmation anticipée ! Le groupe part à %s personnes. Recherche de bar en cours...', v_current_participants),
      true
    );

    -- Nettoyer les votes
    DELETE FROM public.group_force_confirm_votes
    WHERE group_id = p_group_id;

    -- Déclencher l'attribution de bar (via le trigger existant)
    INSERT INTO public.group_messages (group_id, user_id, message, is_system)
    VALUES (
      p_group_id,
      '00000000-0000-0000-0000-000000000000',
      'AUTO_BAR_ASSIGNMENT_TRIGGER',
      true
    );

    RETURN jsonb_build_object(
      'success', true, 
      'confirmed', true,
      'votes', v_votes_count,
      'required', v_current_participants
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true, 
      'confirmed', false,
      'votes', v_votes_count,
      'required', v_current_participants
    );
  END IF;
END;
$$;

-- 5. TRIGGER POUR NETTOYER LES VOTES QUAND UN MEMBRE QUITTE
CREATE OR REPLACE FUNCTION public.cleanup_votes_on_member_leave()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si un membre quitte, reset tous les votes du groupe
  DELETE FROM public.group_force_confirm_votes
  WHERE group_id = OLD.group_id;

  RETURN OLD;
END;
$$;

CREATE TRIGGER cleanup_votes_on_leave
AFTER DELETE ON public.group_participants
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_votes_on_member_leave();

-- 6. FONCTION POUR NETTOYER AUTOMATIQUEMENT LES VOTES EXPIRÉS
CREATE OR REPLACE FUNCTION public.cleanup_expired_force_confirm_votes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.group_force_confirm_votes
  WHERE voted_at <= NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 7. ACTIVER REALTIME
ALTER TABLE public.group_force_confirm_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_force_confirm_votes;