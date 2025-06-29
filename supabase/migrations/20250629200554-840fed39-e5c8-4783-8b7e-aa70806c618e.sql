
-- Correction des 5 fonctions restantes avec des avertissements "Function Search Path Mutable"
-- Ajout de SET search_path = 'public' aux fonctions manquantes

-- 1. Fonction is_group_member
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_participants 
    WHERE group_id = group_uuid 
    AND user_id = user_uuid 
    AND status = 'confirmed'
  );
END;
$function$;

-- 2. Fonction can_view_group
CREATE OR REPLACE FUNCTION public.can_view_group(group_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Permettre de voir les groupes en attente (pour pouvoir les rejoindre)
  -- ou les groupes où l'utilisateur est membre
  RETURN EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_uuid 
    AND (status = 'waiting' OR id IN (
      SELECT group_id FROM public.group_participants 
      WHERE user_id = auth.uid() AND status = 'confirmed'
    ))
  );
END;
$function$;

-- 3. Fonction update_participant_last_seen
CREATE OR REPLACE FUNCTION public.update_participant_last_seen()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  -- Mettre à jour last_seen pour l'utilisateur qui envoie un message
  UPDATE public.group_participants 
  SET last_seen = now()
  WHERE group_id = NEW.group_id 
  AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- 4. Fonction handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- 5. Fonction calculate_distance
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
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
$function$;

-- 6. Fonction add_to_outings_history
CREATE OR REPLACE FUNCTION public.add_to_outings_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
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
$function$;
