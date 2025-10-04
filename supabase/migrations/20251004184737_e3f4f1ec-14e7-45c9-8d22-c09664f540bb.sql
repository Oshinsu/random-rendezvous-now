-- Phase 1: Nettoyage Architecture Critique
-- Suppression des tables dupliquées avec Stripe

-- 1. Supprimer la table bar_subscriptions (duplique Stripe)
DROP TABLE IF EXISTS public.bar_subscriptions CASCADE;

-- 2. Supprimer la table bar_claims (non implémentée)
DROP TABLE IF EXISTS public.bar_claims CASCADE;

-- 3. Note: La table bar_owners reste inchangée et continue de fonctionner
-- 4. Note: La table bar_analytics_reports reste inchangée et continue de fonctionner

COMMENT ON TABLE public.bar_owners IS 'Table principale des gérants de bar. Les abonnements sont gérés uniquement via Stripe.';
COMMENT ON TABLE public.bar_analytics_reports IS 'Rapports analytics mensuels pour les gérants de bar.';
