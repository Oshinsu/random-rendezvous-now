-- Fonction SSOT pour déterminer si un utilisateur est "connecté en temps réel"
-- Cette fonction établit la définition canonique de "connecté" pour toute l'application
-- Aligné avec GROUP_CONSTANTS.HEARTBEAT_INTERVAL (1h) et is_user_connected() frontend

CREATE OR REPLACE FUNCTION public.is_user_connected_realtime(
    p_last_seen timestamp with time zone
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    connection_threshold CONSTANT interval := '60 minutes'; -- Aligné avec HEARTBEAT_INTERVAL
BEGIN
    -- Un utilisateur est considéré connecté si son last_seen est < 60 minutes
    -- Correspond au fait que le heartbeat envoie un signal toutes les heures
    RETURN (p_last_seen > NOW() - connection_threshold);
END;
$function$;

COMMENT ON FUNCTION public.is_user_connected_realtime IS 
'SSOT pour déterminer si un utilisateur est connecté en temps réel.
Aligné avec GROUP_CONSTANTS.HEARTBEAT_INTERVAL (1h).
Utilisé pour l''affichage des indicateurs de connexion dans l''UI.';

-- Exemple d'utilisation dans une requête :
-- SELECT user_id, is_user_connected_realtime(last_seen) as is_connected 
-- FROM group_participants;