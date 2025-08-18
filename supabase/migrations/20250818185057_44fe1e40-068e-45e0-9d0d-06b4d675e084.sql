-- Create or update the trigger function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to migrate existing user metadata to profiles table
CREATE OR REPLACE FUNCTION public.migrate_existing_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
    migrated_count INTEGER := 0;
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    SELECT 
        au.id,
        au.raw_user_meta_data ->> 'first_name',
        au.raw_user_meta_data ->> 'last_name',
        au.email
    FROM auth.users au
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = au.id
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        email = EXCLUDED.email,
        updated_at = NOW();
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % user profiles', migrated_count;
    RETURN migrated_count;
END;
$$;

-- Run the migration for existing users
SELECT public.migrate_existing_users();