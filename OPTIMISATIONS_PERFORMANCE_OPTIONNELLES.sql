-- ⚡ OPTIMISATIONS PERFORMANCE OPTIONNELLES
-- Random Rendezvous - Supabase
-- Date: 19 Novembre 2025
-- Statut: NON CRITIQUE - À appliquer selon les priorités

-- ============================================
-- 1. AJOUTER DES INDEX SUR LES FOREIGN KEYS
-- ============================================
-- Impact: Améliore les performances des JOIN sur ces tables
-- Coût: Minimal (tables peu volumineuses)

CREATE INDEX IF NOT EXISTS idx_alert_logs_alert_id 
ON alert_logs(alert_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_alert_id 
ON email_logs(alert_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id 
ON email_logs(user_id);

-- ============================================
-- 2. SUPPRIMER LES INDEX INUTILISÉS
-- ============================================
-- Impact: Réduit l'overhead des écritures et l'espace disque
-- Coût: Aucun (ces index ne sont jamais utilisés)
-- ⚠️ ATTENTION: Vérifier que ces tables sont vraiment inutilisées avant de supprimer

-- Chat-related indexes
DROP INDEX IF EXISTS idx_chat_conversations_user_id;
DROP INDEX IF EXISTS idx_chat_conversations_customer_id;
DROP INDEX IF EXISTS idx_chat_messages_conversation_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_cache_key;
DROP INDEX IF EXISTS idx_chat_cache_expires;

-- Alert-related indexes
DROP INDEX IF EXISTS idx_alerts_customer_id;
DROP INDEX IF EXISTS idx_alerts_created_at;
DROP INDEX IF EXISTS idx_alerts_is_resolved;
DROP INDEX IF EXISTS idx_alerts_severity;
DROP INDEX IF EXISTS idx_alert_settings_customer_id;

-- Agent-related indexes
DROP INDEX IF EXISTS idx_agent_conversations_thread_id;
DROP INDEX IF EXISTS idx_agent_conversations_customer_id;
DROP INDEX IF EXISTS idx_agent_checkpoints_thread_id;
DROP INDEX IF EXISTS idx_agent_results_conversation_id;
DROP INDEX IF EXISTS idx_agent_threads_conversation;
DROP INDEX IF EXISTS idx_agent_threads_step;
DROP INDEX IF EXISTS idx_agent_logs_conversation;
DROP INDEX IF EXISTS idx_agent_logs_agent_type;
DROP INDEX IF EXISTS idx_agent_logs_created_at;

-- ML-related indexes
DROP INDEX IF EXISTS idx_ml_predictions_customer_id;
DROP INDEX IF EXISTS idx_ml_predictions_type_metric;

-- Google Ads indexes
DROP INDEX IF EXISTS idx_google_ads_data_customer_campaign;
DROP INDEX IF EXISTS idx_google_ads_data_date;
DROP INDEX IF EXISTS idx_google_ads_performance_customer_date;

-- GA4 indexes
DROP INDEX IF EXISTS idx_ga4_data_property_date;
DROP INDEX IF EXISTS idx_ga4_performance_property_date;
DROP INDEX IF EXISTS idx_ga4_cache_key;
DROP INDEX IF EXISTS idx_ga4_cache_expires;

-- Meta Ads indexes
DROP INDEX IF EXISTS idx_meta_ads_data_account_campaign;
DROP INDEX IF EXISTS idx_meta_ads_data_date;
DROP INDEX IF EXISTS idx_meta_ads_performance_account_date;

-- Cache indexes
DROP INDEX IF EXISTS idx_gaql_cache_key;
DROP INDEX IF EXISTS idx_gaql_cache_expires;

-- Other indexes
DROP INDEX IF EXISTS idx_campaign_tags_customer_campaign;
DROP INDEX IF EXISTS idx_search_console_property_date;

-- ============================================
-- 3. VÉRIFIER LES TABLES INUTILISÉES
-- ============================================
-- Ces tables semblent être d'un autre projet (Google Ads/Analytics)
-- Vérifier si elles sont utilisées, sinon les supprimer

-- Liste des tables potentiellement inutilisées:
-- - chat_conversations, chat_messages, chat_cache
-- - alerts, alert_settings, alert_logs, email_logs
-- - agent_conversations, agent_checkpoints, agent_results, agent_threads, agent_execution_logs
-- - ml_predictions
-- - google_ads_data, google_ads_performance
-- - ga4_data, ga4_performance, ga4_cache
-- - meta_ads_data, meta_ads_performance
-- - gaql_cache
-- - campaign_tags
-- - search_console_data

-- Exemple de requête pour vérifier l'utilisation:
-- SELECT COUNT(*) FROM chat_conversations;
-- Si COUNT = 0 et la table n'est jamais utilisée, la supprimer:
-- DROP TABLE IF EXISTS chat_conversations CASCADE;

-- ============================================
-- 4. ANALYSER LES STATISTIQUES DES TABLES
-- ============================================
-- Met à jour les statistiques pour l'optimiseur de requêtes

ANALYZE groups;
ANALYZE group_participants;
ANALYZE profiles;
ANALYZE user_outings_history;
ANALYZE user_notifications;
ANALYZE crm_campaigns;
ANALYZE crm_user_health;

-- ============================================
-- 5. VACUUM DES TABLES PRINCIPALES
-- ============================================
-- Nettoie les lignes mortes et optimise l'espace disque
-- ⚠️ À exécuter pendant les heures creuses

-- VACUUM ANALYZE groups;
-- VACUUM ANALYZE group_participants;
-- VACUUM ANALYZE profiles;
-- VACUUM ANALYZE user_outings_history;
-- VACUUM ANALYZE user_notifications;

-- ============================================
-- 6. MONITORING DES PERFORMANCES
-- ============================================
-- Activer pg_stat_statements pour monitorer les requêtes lentes

-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Requête pour voir les requêtes les plus lentes:
-- SELECT 
--   query,
--   calls,
--   total_exec_time,
--   mean_exec_time,
--   max_exec_time
-- FROM pg_stat_statements
-- ORDER BY mean_exec_time DESC
-- LIMIT 20;

-- ============================================
-- NOTES D'APPLICATION
-- ============================================
-- 1. Tester ces optimisations sur un environnement de staging d'abord
-- 2. Monitorer les performances avant/après
-- 3. Faire un backup avant de supprimer des index ou tables
-- 4. Appliquer progressivement (une section à la fois)
-- 5. Vérifier les logs d'erreur après chaque changement

-- ============================================
-- IMPACT ESTIMÉ
-- ============================================
-- Section 1 (Index FK): +5-10% performance sur les JOIN
-- Section 2 (Supprimer index): -2-5% overhead sur les INSERT/UPDATE
-- Section 3 (Supprimer tables): Libère de l'espace disque
-- Section 4 (ANALYZE): +10-20% performance des requêtes complexes
-- Section 5 (VACUUM): Réduit la taille de la DB de 10-30%

