-- Migration pour supprimer les triggers défectueux qui causent l'erreur "record new has no field preferences"
-- Ces triggers appellent une fonction générique validate_jsonb_schema() incompatible avec les schémas spécifiques des tables

DROP TRIGGER IF EXISTS validate_chat_sessions_jsonb ON public.chat_sessions;
DROP TRIGGER IF EXISTS validate_chat_messages_jsonb ON public.chat_messages;
DROP TRIGGER IF EXISTS validate_favorites_jsonb ON public.favorites;
DROP TRIGGER IF EXISTS validate_analytics_jsonb ON public.analytics;
DROP TRIGGER IF EXISTS validate_cache_entries_jsonb ON public.cache_entries;

-- On garde celui sur profiles et user_profiles car ils ont bien la colonne preferences
-- Mais par sécurité, on va recréer la fonction pour qu'elle soit spécifique à profiles si besoin, 
-- ou simplement laisser tel quel pour l'instant car ça marche pour profiles.


