-- Nettoyer les doublons en gardant l'entrée la plus récente
DELETE FROM public.user_email_preferences 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.user_email_preferences
    ORDER BY user_id, updated_at DESC
);

-- Ajouter une contrainte unique sur user_id pour empêcher les futurs doublons
ALTER TABLE public.user_email_preferences 
ADD CONSTRAINT user_email_preferences_user_id_unique UNIQUE (user_id);