-- ===================================================================
-- AJOUT: Colonnes gender et city dans profiles
-- Date: 2025-11-03
-- Objectif: Enrichir les profils utilisateurs avec genre et ville
-- ===================================================================

-- 1. Créer un type ENUM pour le genre (SOTA Oct 2025 - Inclusif)
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');

-- 2. Ajouter les colonnes à profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender gender_type,
ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Créer un index pour optimiser les recherches par ville
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- 4. Commentaires
COMMENT ON COLUMN public.profiles.gender IS 'Genre de l''utilisateur (inclusif)';
COMMENT ON COLUMN public.profiles.city IS 'Ville de résidence (ex: Paris, Lyon)';

-- 5. Mettre à jour le trigger pour copier gender et city
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, gender, city)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    (NEW.raw_user_meta_data ->> 'gender')::gender_type,
    NEW.raw_user_meta_data ->> 'city'
  );
  RETURN NEW;
END;
$$;

-- 6. Afficher un résumé
SELECT 
    COUNT(*) as total_users,
    COUNT(gender) as users_with_gender,
    COUNT(city) as users_with_city
FROM public.profiles;