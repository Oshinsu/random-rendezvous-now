-- Migration: Fixer search_path sur 27 fonctions PostgreSQL
-- Date: 2025-11-19
-- Priorité: IMPORTANTE (Sécurité)
-- Auteur: Audit Technique Complet

-- Protection contre les attaques par injection de search_path
-- Toutes les fonctions doivent avoir un search_path fixe

-- ============================================
-- FONCTIONS DE NOTIFICATION
-- ============================================
ALTER FUNCTION cleanup_notification_throttle() SET search_path = public, pg_temp;
ALTER FUNCTION check_notification_rate_limit(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION should_send_notification(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION track_notification_open(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION track_notification_click(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION track_notification_conversion(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION update_notification_cache_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION cleanup_expired_analytics_cache() SET search_path = public, pg_temp;
ALTER FUNCTION calculate_notification_rates() SET search_path = public, pg_temp;

-- ============================================
-- FONCTIONS DE TRIGGER EMAIL/NOTIFICATION
-- ============================================
ALTER FUNCTION trigger_member_join_email() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_group_full_email() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_bar_assigned_email() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_first_win_notification() SET search_path = public, pg_temp;

-- ============================================
-- FONCTIONS CRM & AUTOMATION
-- ============================================
ALTER FUNCTION trigger_lifecycle_automation() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_segment_automation() SET search_path = public, pg_temp;
ALTER FUNCTION update_crm_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION check_email_rate_limit_with_warmup() SET search_path = public, pg_temp;
ALTER FUNCTION schedule_campaign_queue_cron(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION unschedule_campaign_queue_cron(uuid) SET search_path = public, pg_temp;

-- ============================================
-- FONCTIONS BLOG & CMS
-- ============================================
ALTER FUNCTION update_blog_article_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_blog_generation() SET search_path = public, pg_temp;
ALTER FUNCTION trigger_seo_calculation() SET search_path = public, pg_temp;
ALTER FUNCTION refresh_cms_engagement() SET search_path = public, pg_temp;

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================
ALTER FUNCTION update_story_likes_count() SET search_path = public, pg_temp;
ALTER FUNCTION log_admin_audit(uuid, text, text, uuid, jsonb, jsonb, jsonb) SET search_path = public, pg_temp;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Vérifier que toutes les fonctions ont maintenant un search_path fixe
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'cleanup_notification_throttle',
    'check_notification_rate_limit',
    'should_send_notification',
    'track_notification_open',
    'track_notification_click',
    'track_notification_conversion',
    'update_notification_cache_timestamp',
    'cleanup_expired_analytics_cache',
    'calculate_notification_rates',
    'trigger_member_join_email',
    'trigger_group_full_email',
    'trigger_bar_assigned_email',
    'trigger_first_win_notification',
    'trigger_lifecycle_automation',
    'trigger_segment_automation',
    'update_crm_updated_at',
    'check_email_rate_limit_with_warmup',
    'schedule_campaign_queue_cron',
    'unschedule_campaign_queue_cron',
    'update_blog_article_updated_at',
    'trigger_blog_generation',
    'trigger_seo_calculation',
    'refresh_cms_engagement',
    'update_story_likes_count',
    'log_admin_audit'
  );
  
  RAISE NOTICE 'Nombre de fonctions avec search_path fixé: %', func_count;
END $$;

