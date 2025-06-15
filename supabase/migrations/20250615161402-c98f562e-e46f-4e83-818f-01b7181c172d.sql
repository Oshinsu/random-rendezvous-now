
-- 1. CORRECTION DES POLITIQUES RLS MANQUANTES ET PERMISSIONS

-- Supprimer toutes les anciennes politiques pour recommencer proprement
DROP POLICY IF EXISTS "Users can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group participants can update groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view group participants" ON public.group_participants;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON public.group_participants;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_participants;
DROP POLICY IF EXISTS "Group members can read messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow system messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own outings history" ON public.user_outings_history;
DROP POLICY IF EXISTS "System can insert outings history" ON public.user_outings_history;
DROP POLICY IF EXISTS "Anyone can view bar ratings" ON public.bar_ratings;
DROP POLICY IF EXISTS "System can manage bar ratings" ON public.bar_ratings;

-- POLITIQUES STRICTES POUR LES GROUPES
CREATE POLICY "Authenticated users can view nearby groups" 
  ON public.groups 
  FOR SELECT 
  TO authenticated
  USING (
    -- Seulement les groupes en status waiting/confirmed
    status IN ('waiting', 'confirmed')
  );

CREATE POLICY "Authenticated users can create groups" 
  ON public.groups 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    max_participants <= 5 AND
    current_participants = 0 AND
    status = 'waiting'
  );

CREATE POLICY "Group members can update their group" 
  ON public.groups 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = groups.id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  )
  WITH CHECK (
    -- Empêcher les modifications dangereuses
    max_participants <= 5 AND
    current_participants <= max_participants AND
    status IN ('waiting', 'confirmed', 'completed', 'cancelled')
  );

-- POLITIQUES STRICTES POUR LES PARTICIPANTS
CREATE POLICY "Users can view participants of their groups only" 
  ON public.group_participants 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_participants gp2
      WHERE gp2.group_id = group_participants.group_id 
      AND gp2.user_id = auth.uid()
      AND gp2.status = 'confirmed'
    )
  );

CREATE POLICY "Users can join groups with restrictions" 
  ON public.group_participants 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'confirmed' AND
    -- Vérifier que le groupe existe et n'est pas plein
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id 
      AND status = 'waiting' 
      AND current_participants < max_participants
    )
  );

CREATE POLICY "Users can update their own participation only" 
  ON public.group_participants 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave their own groups only" 
  ON public.group_participants 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- POLITIQUES STRICTES POUR LES MESSAGES
CREATE POLICY "Group members can read group messages only" 
  ON public.group_messages 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = group_messages.group_id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  );

CREATE POLICY "Group members can send messages with validation" 
  ON public.group_messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    is_system = false AND
    length(trim(message)) > 0 AND
    length(trim(message)) <= 500 AND
    EXISTS (
      SELECT 1 FROM public.group_participants 
      WHERE group_participants.group_id = group_messages.group_id 
      AND group_participants.user_id = auth.uid()
      AND group_participants.status = 'confirmed'
    )
  );

CREATE POLICY "System can send system messages" 
  ON public.group_messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    is_system = true AND
    user_id = '00000000-0000-0000-0000-000000000000'
  );

-- POLITIQUES STRICTES POUR LES PROFILS
CREATE POLICY "Users can view only their own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update only their own profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id) 
  WITH CHECK (
    auth.uid() = id AND
    length(coalesce(first_name, '')) <= 50 AND
    length(coalesce(last_name, '')) <= 50
  );

-- POLITIQUES STRICTES POUR L'HISTORIQUE
CREATE POLICY "Users can view only their own outings history" 
  ON public.user_outings_history 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert outings history with validation" 
  ON public.user_outings_history 
  FOR INSERT 
  TO service_role
  WITH CHECK (
    participants_count > 0 AND
    participants_count <= 5 AND
    length(trim(bar_name)) > 0 AND
    length(trim(bar_address)) > 0
  );

CREATE POLICY "Users can update their own ratings only" 
  ON public.user_outings_history 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)) AND
    length(coalesce(user_review, '')) <= 1000
  );

-- POLITIQUES POUR LES RATINGS DE BARS
CREATE POLICY "Anyone can view bar ratings" 
  ON public.bar_ratings 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "System can manage bar ratings" 
  ON public.bar_ratings 
  FOR ALL 
  TO service_role
  USING (true) 
  WITH CHECK (
    total_ratings >= 0 AND
    sum_ratings >= 0 AND
    average_rating >= 0.0 AND
    average_rating <= 5.0
  );

-- 2. FONCTIONS DE VALIDATION ET SÉCURITÉ

-- Fonction pour valider et nettoyer les messages
CREATE OR REPLACE FUNCTION public.validate_and_clean_message(input_message text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Nettoyer et valider le message
  input_message := trim(input_message);
  
  -- Vérifications de sécurité
  IF input_message IS NULL OR length(input_message) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  IF length(input_message) > 500 THEN
    RAISE EXCEPTION 'Message too long (max 500 characters)';
  END IF;
  
  -- Échapper les caractères dangereux (basique)
  input_message := replace(input_message, '<script', '&lt;script');
  input_message := replace(input_message, '</script', '&lt;/script');
  input_message := replace(input_message, 'javascript:', 'javascript_');
  input_message := replace(input_message, 'data:', 'data_');
  
  RETURN input_message;
END;
$$;

-- Fonction pour valider les coordonnées géographiques
CREATE OR REPLACE FUNCTION public.validate_coordinates(lat double precision, lng double precision)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (lat IS NOT NULL AND lng IS NOT NULL AND 
          lat >= -90 AND lat <= 90 AND 
          lng >= -180 AND lng <= 180);
END;
$$;

-- Fonction pour vérifier la limite de participation par utilisateur
CREATE OR REPLACE FUNCTION public.check_user_participation_limit(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    active_groups_count integer;
BEGIN
  SELECT COUNT(*) INTO active_groups_count
  FROM public.group_participants gp
  JOIN public.groups g ON gp.group_id = g.id
  WHERE gp.user_id = user_uuid 
  AND gp.status = 'confirmed'
  AND g.status IN ('waiting', 'confirmed');
  
  RETURN active_groups_count = 0; -- Un seul groupe actif autorisé
END;
$$;

-- 3. TRIGGERS DE VALIDATION

-- Trigger pour valider les messages avant insertion
CREATE OR REPLACE FUNCTION public.validate_message_before_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Valider et nettoyer le message
  NEW.message := public.validate_and_clean_message(NEW.message);
  
  -- Mettre à jour le last_seen automatiquement
  IF NOT NEW.is_system THEN
    UPDATE public.group_participants 
    SET last_seen = now()
    WHERE group_id = NEW.group_id 
    AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_message ON public.group_messages;
CREATE TRIGGER trigger_validate_message
  BEFORE INSERT ON public.group_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_message_before_insert();

-- Trigger pour valider les participants avant insertion
CREATE OR REPLACE FUNCTION public.validate_participant_before_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier la limite de participation
  IF NOT public.check_user_participation_limit(NEW.user_id) THEN
    RAISE EXCEPTION 'User is already in an active group';
  END IF;
  
  -- Valider les coordonnées si présentes
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    IF NOT public.validate_coordinates(NEW.latitude, NEW.longitude) THEN
      RAISE EXCEPTION 'Invalid coordinates provided';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_participant ON public.group_participants;
CREATE TRIGGER trigger_validate_participant
  BEFORE INSERT ON public.group_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_participant_before_insert();

-- 4. CORRECTION DES COLONNES SENSIBLES

-- S'assurer que user_id ne peut pas être NULL dans les tables critiques
ALTER TABLE public.group_participants ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.group_messages ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_outings_history ALTER COLUMN user_id SET NOT NULL;

-- Ajouter des contraintes de validation
ALTER TABLE public.groups ADD CONSTRAINT check_max_participants CHECK (max_participants > 0 AND max_participants <= 5);
ALTER TABLE public.groups ADD CONSTRAINT check_current_participants CHECK (current_participants >= 0 AND current_participants <= max_participants);
ALTER TABLE public.user_outings_history ADD CONSTRAINT check_participants_count CHECK (participants_count > 0 AND participants_count <= 5);

-- 5. INDEX POUR LA PERFORMANCE ET SÉCURITÉ

-- Index pour les requêtes géographiques sécurisées
CREATE INDEX IF NOT EXISTS idx_groups_security_lookup ON public.groups(status, latitude, longitude) WHERE status IN ('waiting', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_participants_security_lookup ON public.group_participants(user_id, status, group_id) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_messages_security_lookup ON public.group_messages(group_id, created_at, user_id);

-- Index simple pour éviter les doublons (sans subquery)
CREATE INDEX IF NOT EXISTS idx_active_participants ON public.group_participants(user_id, status, group_id) WHERE status = 'confirmed';
