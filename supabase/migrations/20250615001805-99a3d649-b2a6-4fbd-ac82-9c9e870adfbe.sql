
-- Créer une table pour l'historique des sorties
CREATE TABLE public.user_outings_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL,
  bar_name TEXT NOT NULL,
  bar_address TEXT NOT NULL,
  meeting_time TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  participants_count INTEGER NOT NULL DEFAULT 0,
  bar_latitude DOUBLE PRECISION,
  bar_longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.user_outings_history ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leur propre historique
CREATE POLICY "Users can view their own outings history"
  ON public.user_outings_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique pour permettre l'insertion dans l'historique
CREATE POLICY "System can insert outings history"
  ON public.user_outings_history
  FOR INSERT
  WITH CHECK (true);

-- Créer un index pour optimiser les requêtes
CREATE INDEX idx_user_outings_history_user_id ON public.user_outings_history(user_id);
CREATE INDEX idx_user_outings_history_completed_at ON public.user_outings_history(completed_at DESC);

-- Fonction pour automatiquement ajouter une sortie à l'historique quand un groupe passe en "completed"
CREATE OR REPLACE FUNCTION add_to_outings_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le groupe passe de 'confirmed' à 'completed'
  IF OLD.status = 'confirmed' AND NEW.status = 'completed' AND NEW.bar_name IS NOT NULL THEN
    -- Ajouter chaque participant à l'historique
    INSERT INTO public.user_outings_history (
      user_id,
      group_id,
      bar_name,
      bar_address,
      meeting_time,
      participants_count,
      bar_latitude,
      bar_longitude
    )
    SELECT 
      gp.user_id,
      NEW.id,
      NEW.bar_name,
      NEW.bar_address,
      NEW.meeting_time,
      NEW.current_participants,
      NEW.bar_latitude,
      NEW.bar_longitude
    FROM public.group_participants gp
    WHERE gp.group_id = NEW.id 
      AND gp.status = 'confirmed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER trigger_add_to_outings_history
  AFTER UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION add_to_outings_history();
