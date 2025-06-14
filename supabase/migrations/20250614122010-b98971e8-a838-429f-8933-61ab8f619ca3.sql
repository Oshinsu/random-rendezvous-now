
-- Ajouter des colonnes de géolocalisation à la table des groupes
ALTER TABLE public.groups 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN location_name TEXT,
ADD COLUMN search_radius INTEGER DEFAULT 5000; -- rayon de recherche en mètres

-- Ajouter des colonnes de géolocalisation à la table des participants
ALTER TABLE public.group_participants 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN location_name TEXT;

-- Créer une fonction pour calculer la distance entre deux points (formule haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
    r DOUBLE PRECISION := 6371000; -- Rayon de la Terre en mètres
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * asin(sqrt(a));
    
    RETURN r * c;
END;
$$ LANGUAGE plpgsql;

-- Créer un index pour optimiser les requêtes de géolocalisation
CREATE INDEX IF NOT EXISTS idx_groups_location ON public.groups(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_participants_location ON public.group_participants(latitude, longitude);
