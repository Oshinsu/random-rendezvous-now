
-- Création de la table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY, -- Référence l'ID de auth.users
  first_name TEXT,
  last_name TEXT,
  email TEXT, -- Peut être utile pour des requêtes directes, même si déjà dans auth.users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Commentaire pour la table des profils
COMMENT ON TABLE public.profiles IS 'Stocke les informations de profil public pour les utilisateurs.';
COMMENT ON COLUMN public.profiles.id IS 'Référence à auth.users.id';

-- Activation de la sécurité au niveau des lignes (RLS) pour la table des profils
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent consulter leur propre profil
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fonction pour gérer la création d'un nouveau profil utilisateur lors de l'inscription
-- Cette fonction sera appelée par un déclencheur (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute la fonction avec les droits du créateur (souvent un superutilisateur)
SET search_path = public -- Assure que la fonction trouve la table profiles dans le schéma public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, -- ID du nouvel utilisateur depuis auth.users
    NEW.raw_user_meta_data ->> 'first_name', -- Sera extrait des métadonnées fournies lors de l'inscription
    NEW.raw_user_meta_data ->> 'last_name',  -- Sera extrait des métadonnées fournies lors de l'inscription
    NEW.email -- Email du nouvel utilisateur depuis auth.users
  );
  RETURN NEW;
END;
$$;

-- Commentaire pour la fonction handle_new_user
COMMENT ON FUNCTION public.handle_new_user() IS 'Crée une entrée dans la table public.profiles pour chaque nouvel utilisateur.';

-- Déclencheur (trigger) pour appeler la fonction handle_new_user après l'insertion d'un nouvel utilisateur dans auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

