-- Modifier le type ENUM gender_type pour avoir uniquement male et female
-- 1. Supprimer l'ancien type et le recréer
DROP TYPE IF EXISTS gender_type CASCADE;
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- 2. Recréer la colonne avec le nouveau type
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS gender;

ALTER TABLE public.profiles 
ADD COLUMN gender gender_type;

-- 3. Mettre à jour le trigger handle_new_user
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