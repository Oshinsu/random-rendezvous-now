-- Migration: Activer RLS sur 4 tables critiques
-- Date: 2025-11-19
-- Priorité: CRITIQUE
-- Auteur: Audit Technique Complet

-- ============================================
-- 1. TABLE: notification_deduplication
-- ============================================
ALTER TABLE notification_deduplication ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres déduplication
CREATE POLICY "Users can view own notification deduplication"
ON notification_deduplication
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politique: Service role a accès complet
CREATE POLICY "Service role has full access to notification_deduplication"
ON notification_deduplication
FOR ALL
TO service_role
USING (true);

-- ============================================
-- 2. TABLE: zoho_oauth_tokens (CRITIQUE)
-- ============================================
ALTER TABLE zoho_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Politique: UNIQUEMENT service_role peut accéder
-- Cette table contient des tokens OAuth sensibles
CREATE POLICY "Only service_role can access zoho_oauth_tokens"
ON zoho_oauth_tokens
FOR ALL
TO service_role
USING (true);

-- ============================================
-- 3. TABLE: email_warmup_schedule
-- ============================================
ALTER TABLE email_warmup_schedule ENABLE ROW LEVEL SECURITY;

-- Politique: Admins peuvent tout voir
CREATE POLICY "Admins can view email_warmup_schedule"
ON email_warmup_schedule
FOR SELECT
TO authenticated
USING (is_admin_user());

-- Politique: Service role a accès complet
CREATE POLICY "Service role has full access to email_warmup_schedule"
ON email_warmup_schedule
FOR ALL
TO service_role
USING (true);

-- ============================================
-- 4. TABLE: email_send_tracking
-- ============================================
ALTER TABLE email_send_tracking ENABLE ROW LEVEL SECURITY;

-- Politique: Admins peuvent tout voir
CREATE POLICY "Admins can view email_send_tracking"
ON email_send_tracking
FOR SELECT
TO authenticated
USING (is_admin_user());

-- Politique: Service role a accès complet
CREATE POLICY "Service role has full access to email_send_tracking"
ON email_send_tracking
FOR ALL
TO service_role
USING (true);

-- ============================================
-- COMMENTAIRES DE SÉCURITÉ
-- ============================================
COMMENT ON TABLE zoho_oauth_tokens IS 'CRITIQUE: Contient les tokens OAuth Zoho. Accès restreint au service_role uniquement.';
COMMENT ON TABLE notification_deduplication IS 'Déduplication des notifications. Accès utilisateur limité à ses propres données.';
COMMENT ON TABLE email_warmup_schedule IS 'Configuration du warmup email. Accès admin uniquement.';
COMMENT ON TABLE email_send_tracking IS 'Tracking des envois email. Accès admin uniquement.';

