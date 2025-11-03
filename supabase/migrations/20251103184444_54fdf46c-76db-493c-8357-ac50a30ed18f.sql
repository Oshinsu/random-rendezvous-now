-- Enable pg_net extension if not already enabled (for HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger pour envoyer "First Win" après première sortie complétée
CREATE OR REPLACE FUNCTION trigger_first_win_notification()
RETURNS TRIGGER AS $$
DECLARE
  outing_count INTEGER;
  bar_name_val TEXT;
BEGIN
  -- Compter les sorties de l'utilisateur
  SELECT COUNT(*) INTO outing_count
  FROM user_outings_history
  WHERE user_id = NEW.user_id;
  
  -- Si c'est la première sortie, envoyer notification
  IF outing_count = 1 THEN
    -- Récupérer le nom du bar
    SELECT name INTO bar_name_val
    FROM bars
    WHERE id = NEW.bar_id
    LIMIT 1;
    
    -- Appeler l'edge function send-first-win de manière asynchrone
    PERFORM net.http_post(
      url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/send-first-win',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs'
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'bar_name', COALESCE(bar_name_val, 'Random Bar')
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_first_outing_completed ON user_outings_history;
CREATE TRIGGER on_first_outing_completed
AFTER INSERT ON user_outings_history
FOR EACH ROW
EXECUTE FUNCTION trigger_first_win_notification();