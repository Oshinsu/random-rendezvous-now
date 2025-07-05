-- Nettoyage des données corrompues où les noms de bars sont des Place IDs
-- Corriger les groupes qui ont des Place IDs comme noms de bars

UPDATE groups 
SET bar_name = 'Bar en cours de validation'
WHERE bar_name IS NOT NULL 
  AND (bar_name LIKE 'places/%' OR bar_name LIKE 'ChIJ%');

-- Corriger les données dans l'historique des sorties
UPDATE user_outings_history 
SET bar_name = 'Bar visité'  
WHERE bar_name IS NOT NULL 
  AND (bar_name LIKE 'places/%' OR bar_name LIKE 'ChIJ%');

-- Corriger les données des ratings de bars
UPDATE bar_ratings 
SET bar_name = 'Bar évalué'
WHERE bar_name IS NOT NULL 
  AND (bar_name LIKE 'places/%' OR bar_name LIKE 'ChIJ%');

-- Ajouter une fonction pour valider les noms de bars avant insertion
CREATE OR REPLACE FUNCTION validate_bar_name(input_name text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que le nom n'est pas un Place ID
  IF input_name IS NULL THEN
    RETURN false;
  END IF;
  
  IF input_name LIKE 'places/%' OR input_name LIKE 'ChIJ%' THEN
    RETURN false;
  END IF;
  
  IF length(trim(input_name)) < 2 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;