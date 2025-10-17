-- Corriger le type de retour de force_confirm_incomplete_group (JSONB → JSON)
-- Drop et recréer la fonction avec le bon type de retour

DROP FUNCTION IF EXISTS public.force_confirm_incomplete_group(UUID, UUID);

CREATE OR REPLACE FUNCTION public.force_confirm_incomplete_group(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS JSON
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
  SELECT * INTO v_group FROM public.groups WHERE id = p_group_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Groupe introuvable');
  END IF;
  
  -- Vérifier que le groupe est en attente
  IF v_group.status != 'waiting' THEN
    RETURN json_build_object('success', false, 'error', 'Groupe déjà confirmé ou annulé');
  END IF;
  
  -- Vérifier si l'utilisateur est membre du groupe
  IF NOT EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = p_group_id AND user_id = p_user_id AND status = 'confirmed'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Vous n''êtes pas membre de ce groupe');
  END IF;
  
  -- Vérifier si l'utilisateur a déjà voté
  SELECT EXISTS (
    SELECT 1 FROM public.group_force_confirm_votes 
    WHERE group_id = p_group_id 
    AND user_id = p_user_id
    AND voted_at > NOW() - INTERVAL '1 hour'
  ) INTO v_vote_exists;
  
  IF v_vote_exists THEN
    RETURN json_build_object('success', false, 'error', 'Vous avez déjà voté');
  END IF;
  
  -- Enregistrer le vote
  INSERT INTO public.group_force_confirm_votes (group_id, user_id)
  VALUES (p_group_id, p_user_id);
  
  -- Compter les votes récents (< 1h)
  SELECT COUNT(*) INTO v_votes_count
  FROM public.group_force_confirm_votes
  WHERE group_id = p_group_id
  AND voted_at > NOW() - INTERVAL '1 hour';
  
  -- Nombre de participants actuels
  v_current_participants := v_group.current_participants;
  
  -- Si unanimité atteinte, confirmer le groupe
  IF v_votes_count >= v_current_participants THEN
    -- Confirmer le groupe
    UPDATE public.groups
    SET status = 'confirmed'
    WHERE id = p_group_id;
    
    -- Message système
    INSERT INTO public.group_messages (group_id, user_id, message, is_system)
    VALUES (
      p_group_id,
      '00000000-0000-0000-0000-000000000000',
      '🎉 Unanimité atteinte ! Recherche de bar en cours...',
      true
    );
    
    RAISE NOTICE 'Groupe % confirmé par force_confirm (votes: %/%)', p_group_id, v_votes_count, v_current_participants;
    
    -- Retourner confirmed: true pour que le frontend déclenche l'Edge Function
    RETURN json_build_object(
      'success', true,
      'confirmed', true,
      'votes', v_votes_count,
      'required', v_current_participants
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'confirmed', false,
      'votes', v_votes_count,
      'required', v_current_participants
    );
  END IF;
END;
$$;