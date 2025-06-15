
-- Ajouter une colonne de rating à la table user_outings_history
ALTER TABLE public.user_outings_history 
ADD COLUMN user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
ADD COLUMN user_review TEXT,
ADD COLUMN rated_at TIMESTAMP WITH TIME ZONE;

-- Créer une table pour stocker les ratings globaux des bars
CREATE TABLE public.bar_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bar_place_id TEXT NOT NULL,
  bar_name TEXT NOT NULL,
  bar_address TEXT NOT NULL,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  sum_ratings INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(bar_place_id)
);

-- Activer RLS sur la table bar_ratings
ALTER TABLE public.bar_ratings ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture des ratings de bar à tous
CREATE POLICY "Anyone can view bar ratings"
  ON public.bar_ratings
  FOR SELECT
  USING (true);

-- Politique pour permettre l'insertion/mise à jour via des fonctions système
CREATE POLICY "System can manage bar ratings"
  ON public.bar_ratings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fonction pour mettre à jour les ratings globaux des bars
CREATE OR REPLACE FUNCTION update_bar_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est un nouveau rating
  IF TG_OP = 'UPDATE' AND OLD.user_rating IS NULL AND NEW.user_rating IS NOT NULL THEN
    -- Insérer ou mettre à jour le rating global du bar
    INSERT INTO public.bar_ratings (
      bar_place_id, bar_name, bar_address, total_ratings, sum_ratings, average_rating
    )
    VALUES (
      (SELECT bar_place_id FROM public.groups WHERE id = NEW.group_id),
      NEW.bar_name,
      NEW.bar_address,
      1,
      NEW.user_rating,
      NEW.user_rating::decimal
    )
    ON CONFLICT (bar_place_id) 
    DO UPDATE SET
      total_ratings = bar_ratings.total_ratings + 1,
      sum_ratings = bar_ratings.sum_ratings + NEW.user_rating,
      average_rating = (bar_ratings.sum_ratings + NEW.user_rating)::decimal / (bar_ratings.total_ratings + 1),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour les ratings
CREATE TRIGGER trigger_update_bar_rating
  AFTER UPDATE ON public.user_outings_history
  FOR EACH ROW
  EXECUTE FUNCTION update_bar_rating();

-- Ajouter des colonnes pour les réactions aux messages
ALTER TABLE public.group_messages 
ADD COLUMN reactions JSONB DEFAULT '{}'::jsonb;

-- Index pour optimiser les requêtes sur les ratings
CREATE INDEX idx_bar_ratings_average ON public.bar_ratings(average_rating DESC);
CREATE INDEX idx_user_outings_history_rating ON public.user_outings_history(user_rating);
