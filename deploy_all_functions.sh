#!/bin/bash

# Script pour déployer toutes les Edge Functions Supabase
# Usage: ./deploy_all_functions.sh

echo "🚀 Déploiement de toutes les Edge Functions..."

# Liste des fonctions à déployer
functions=(
  "activate-scheduled-groups"
  "admin-chat"
  "api-logger"
  "award-referral-credits"
  "bar-customer-portal"
  "bootstrap-zoho-token"
  "calculate-all-health-scores"
  "calculate-cms-seo"
  "campaign-ai-suggestions"
  "check-bar-subscription"
  "check-inactive-users"
  "cleanup-bar-cache"
  "cleanup-groups"
  "cms-ai-copywriter"
  "create-bar-checkout"
  "create-test-scenario"
  "daily-blog-generation"
  "detect-user-gender"
  "diagnose-system"
  "enqueue-campaign-emails"
  "execute-sequence"
  "generate-bar-analytics"
  "generate-seo-article"
  "get-cached-bar-status"
  "get-campaign-queues"
  "get-maps-config"
  "get-notification-analytics"
  "get-stripe-mrr"
  "improve-notification-copy"
  "lifecycle-automations"
  "moderate-story"
  "monitor-blog-health"
  "optimize-send-time"
  "pause-campaign-queue"
  "process-campaign-queue"
  "process-recurring-campaigns"
  "process-scheduled-sends"
  "refresh-zoho-token"
  "resume-campaign-queue"
  "scheduled-campaigns"
  "send-first-win"
  "send-group-email"
  "send-lifecycle-campaign"
  "send-peak-hours-nudge"
  "send-push-notification"
  "send-welcome-fun"
  "send-zoho-email"
  "simple-auto-assign-bar"
  "simple-bar-search"
  "sync-notification-analytics"
  "system-messaging"
  "test-api-logger"
  "test-auto-bar-assignment"
  "test-bar-assignment"
  "test-zoho-send"
  "track-campaign-interaction"
  "trigger-bar-assignment"
  "trigger-blog-generation"
  "update-notification-config-stats"
  "validate-oauth-request"
)

for func in "${functions[@]}"; do
  echo "📦 Déploiement de $func..."
  npx supabase functions deploy "$func" --no-verify-jwt
done

echo "✅ Toutes les fonctions ont été déployées !"


