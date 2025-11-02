-- ========================================
-- PHASE 1: CORRECTION CRITIQUE DU COMPTEUR current_participants
-- ========================================

-- Fonction trigger pour gérer automatiquement le compteur de participants
CREATE OR REPLACE FUNCTION handle_group_participant_changes_ppu()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  old_count integer;
  new_count integer;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Logger l'état avant
    SELECT current_participants INTO old_count FROM groups WHERE id = NEW.group_id;
    
    -- Incrémenter le compteur atomiquement
    UPDATE groups 
    SET current_participants = current_participants + 1,
        updated_at = NOW()
    WHERE id = NEW.group_id
    RETURNING current_participants INTO new_count;
    
    -- Logger l'état après
    RAISE NOTICE 'PARTICIPANT_JOINED: group_id=%, user_id=%, old_count=%, new_count=%', 
      NEW.group_id, NEW.user_id, old_count, new_count;
    
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    -- Logger l'état avant
    SELECT current_participants INTO old_count FROM groups WHERE id = OLD.group_id;
    
    -- Décrémenter le compteur atomiquement
    UPDATE groups 
    SET current_participants = GREATEST(current_participants - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.group_id
    RETURNING current_participants INTO new_count;
    
    -- Logger l'état après
    RAISE NOTICE 'PARTICIPANT_LEFT: group_id=%, user_id=%, old_count=%, new_count=%', 
      OLD.group_id, OLD.user_id, old_count, new_count;
  END IF;
  
  RETURN NULL; -- AFTER trigger, return value doesn't matter
END;
$$;

-- Créer le trigger sur INSERT
DROP TRIGGER IF EXISTS trigger_update_participant_count_insert ON group_participants;
CREATE TRIGGER trigger_update_participant_count_insert
AFTER INSERT ON group_participants
FOR EACH ROW
EXECUTE FUNCTION handle_group_participant_changes_ppu();

-- Créer le trigger sur DELETE
DROP TRIGGER IF EXISTS trigger_update_participant_count_delete ON group_participants;
CREATE TRIGGER trigger_update_participant_count_delete
AFTER DELETE ON group_participants
FOR EACH ROW
EXECUTE FUNCTION handle_group_participant_changes_ppu();

-- ========================================
-- PHASE 4: RENFORCEMENT DES RLS POLICIES
-- ========================================

-- Remplacer la policy permissive par une policy restrictive
DROP POLICY IF EXISTS "authenticated_users_can_update_groups_v2" ON groups;

CREATE POLICY "group_members_can_update_their_group_v2"
ON groups FOR UPDATE
TO public
USING (
  -- L'utilisateur doit être un participant confirmé du groupe
  EXISTS (
    SELECT 1 FROM group_participants gp
    WHERE gp.group_id = groups.id
    AND gp.user_id = auth.uid()
    AND gp.status = 'confirmed'
  )
  -- OU être admin
  OR is_admin_user()
)
WITH CHECK (
  -- Empêcher les modifications dangereuses
  status IN ('waiting', 'confirmed', 'completed', 'cancelled')
  AND max_participants BETWEEN 2 AND 10
  AND current_participants <= max_participants
);

-- ========================================
-- PHASE 5: PRÉVENTION DES DOUBLE-INSERTIONS
-- ========================================

-- Ajouter une contrainte UNIQUE composite (group_id, user_id)
ALTER TABLE group_participants
DROP CONSTRAINT IF EXISTS unique_user_per_group;

ALTER TABLE group_participants
ADD CONSTRAINT unique_user_per_group 
UNIQUE (group_id, user_id);