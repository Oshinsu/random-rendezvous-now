-- ==============================================================================
-- 🚨 SCRIPT DE CORRECTION COMPLET - RANDOM RENDEZVOUS
-- 📅 Date: 19 Novembre 2025
-- ℹ️ Instructions: Copiez tout ce contenu et exécutez-le dans l'éditeur SQL Supabase
-- ==============================================================================

-- 1. SÉCURISATION DES TABLES CRITIQUES (RLS)
-- ==========================================

-- Table: notification_deduplication
ALTER TABLE notification_deduplication ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification deduplication"
ON notification_deduplication FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role has full access to notification_deduplication"
ON notification_deduplication FOR ALL TO service_role
USING (true);

-- Table: zoho_oauth_tokens (CRITIQUE)
ALTER TABLE zoho_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service_role can access zoho_oauth_tokens"
ON zoho_oauth_tokens FOR ALL TO service_role
USING (true);

-- Table: email_warmup_schedule
ALTER TABLE email_warmup_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email_warmup_schedule"
ON email_warmup_schedule FOR SELECT TO authenticated
USING (is_admin_user());

CREATE POLICY "Service role has full access to email_warmup_schedule"
ON email_warmup_schedule FOR ALL TO service_role
USING (true);

-- Table: email_send_tracking
ALTER TABLE email_send_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email_send_tracking"
ON email_send_tracking FOR SELECT TO authenticated
USING (is_admin_user());

CREATE POLICY "Service role has full access to email_send_tracking"
ON email_send_tracking FOR ALL TO service_role
USING (true);

-- 2. SÉCURISATION DES FONCTIONS (SEARCH_PATH)
-- ===========================================

ALTER FUNCTION cleanup_notification_throttle() SET search_path = public, pg_temp;
ALTER FUNCTION check_notification_rate_limit(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION should_send_notification(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION track_notification_open(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION track_notification_click(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION track_notification_conversion(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION update_notification_cache_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION cleanup_expired_analytics_cache() SET search_path = public, pg_temp;
ALTER FUNCTION calculate_notification_rates() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_member_join_email() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_group_full_email() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_bar_assigned_email() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_first_win_notification() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_lifecycle_automation() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_segment_automation() SET search_path = public, pg_temp;
ALTER FUNCTION update_crm_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION check_email_rate_limit_with_warmup() SET search_path = public, pg_temp;
ALTER FUNCTION schedule_campaign_queue_cron(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION unschedule_campaign_queue_cron(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION update_blog_article_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_blog_generation() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_seo_calculation() SET search_path = public, pg_temp;
ALTER FUNCTION refresh_cms_engagement() SET search_path = public, pg_temp;
ALTER FUNCTION update_story_likes_count() SET search_path = public, pg_temp;
ALTER FUNCTION log_admin_audit(uuid, text, text, uuid, jsonb, jsonb, jsonb) SET search_path = public, pg_temp;

-- 3. DIAGNOSTIC GROUPES (OPTIONNEL - Pour voir le problème)
-- =========================================================

/*
-- Décommentez pour voir les groupes problématiques
SELECT 
  id, status, current_participants, max_participants, created_at 
FROM groups 
WHERE status = 'waiting' 
ORDER BY created_at DESC 
LIMIT 10;
*/

