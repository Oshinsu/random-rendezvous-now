-- Nettoyer les doublons en gardant l'entrée la plus récente
DELETE FROM public.user_email_preferences 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.user_email_preferences
    ORDER BY user_id, updated_at DESC
);