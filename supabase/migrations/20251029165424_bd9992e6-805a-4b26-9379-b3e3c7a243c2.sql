-- =====================================================
-- MIGRATION: Email Triggers pour événements groupes
-- Description: Ajout de triggers SQL pour envoyer des emails transactionnels
--              lors de join, groupe complet, et bar assigné
-- =====================================================

-- TRIGGER 1: Envoi email quand quelqu'un rejoint un groupe
CREATE OR REPLACE FUNCTION trigger_member_join_email()
RETURNS TRIGGER AS $$
DECLARE
  group_member RECORD;
  new_member_name TEXT;
  group_count INTEGER;
BEGIN
  -- Récupérer le nom du nouveau membre
  SELECT COALESCE(p.first_name, 'Un aventurier')
  INTO new_member_name
  FROM profiles p
  WHERE p.id = NEW.user_id;
  
  -- Récupérer le nombre actuel de participants
  SELECT current_participants
  INTO group_count
  FROM groups
  WHERE id = NEW.group_id;
  
  -- Envoyer email à tous les membres existants (sauf le nouveau)
  FOR group_member IN 
    SELECT u.email, u.id
    FROM group_participants gp
    JOIN auth.users u ON gp.user_id = u.id
    WHERE gp.group_id = NEW.group_id 
      AND gp.user_id != NEW.user_id
      AND gp.status = 'confirmed'
      AND u.email IS NOT NULL
  LOOP
    -- Appel HTTP à l'edge function send-group-email
    PERFORM net.http_post(
      url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-group-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
      ),
      body := jsonb_build_object(
        'type', 'member_joined',
        'user_email', group_member.email,
        'group_id', NEW.group_id,
        'new_member_name', new_member_name,
        'current_count', group_count
      )::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_member_join_email
AFTER INSERT ON group_participants
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION trigger_member_join_email();

-- TRIGGER 2: Envoi email quand le groupe est complet (5 membres)
CREATE OR REPLACE FUNCTION trigger_group_full_email()
RETURNS TRIGGER AS $$
DECLARE
  group_member RECORD;
BEGIN
  -- Vérifier si le groupe vient de se remplir (4 → 5 participants)
  IF NEW.current_participants = 5 AND (OLD.current_participants IS NULL OR OLD.current_participants < 5) THEN
    FOR group_member IN 
      SELECT u.email
      FROM group_participants gp
      JOIN auth.users u ON gp.user_id = u.id
      WHERE gp.group_id = NEW.id 
        AND gp.status = 'confirmed'
        AND u.email IS NOT NULL
    LOOP
      PERFORM net.http_post(
        url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-group-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
        ),
        body := jsonb_build_object(
          'type', 'group_full',
          'user_email', group_member.email,
          'group_id', NEW.id
        )::text
      );
    END LOOP;
    RAISE NOTICE 'Emails "groupe complet" envoyés pour groupe %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_group_full_email
AFTER UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION trigger_group_full_email();

-- TRIGGER 3: Envoi email quand le bar est assigné
CREATE OR REPLACE FUNCTION trigger_bar_assigned_email()
RETURNS TRIGGER AS $$
DECLARE
  group_member RECORD;
BEGIN
  -- Vérifier si le groupe passe à 'confirmed' ET a un bar assigné
  IF (OLD.status IS NULL OR OLD.status != 'confirmed') 
     AND NEW.status = 'confirmed' 
     AND NEW.bar_name IS NOT NULL 
     AND NEW.meeting_time IS NOT NULL THEN
    FOR group_member IN 
      SELECT u.email
      FROM group_participants gp
      JOIN auth.users u ON gp.user_id = u.id
      WHERE gp.group_id = NEW.id 
        AND gp.status = 'confirmed'
        AND u.email IS NOT NULL
    LOOP
      PERFORM net.http_post(
        url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-group-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
        ),
        body := jsonb_build_object(
          'type', 'bar_assigned',
          'user_email', group_member.email,
          'group_id', NEW.id,
          'bar_name', NEW.bar_name,
          'bar_address', NEW.bar_address,
          'meeting_time', to_char(NEW.meeting_time, 'HH24:MI')
        )::text
      );
    END LOOP;
    RAISE NOTICE 'Emails "bar assigné" envoyés pour groupe %', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_bar_assigned_email
AFTER UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION trigger_bar_assigned_email();