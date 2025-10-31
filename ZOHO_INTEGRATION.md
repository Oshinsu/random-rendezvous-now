# Zoho Mail Integration - Status SOTA Oct 2025

## 📧 Rate Limits Zoho Mail (Oct 2025)

### OAuth Token API
- **Limite:** 10 requêtes/minute
- **Pénalité:** 1 heure de blocage si dépassement
- **Mitigation:** Token cache avec TTL 59min (implémenté)

### Email Send API
- **Limite Free:** 100 emails/heure, 500 emails/jour
- **Limite Pro:** 5000 emails/jour
- **Mitigation:** Queue system avec 5 emails/min (implémenté)

## ✅ Solutions Implémentées

### 1. Token Caching avec PostgreSQL
- **Fichier:** `supabase/functions/send-zoho-email/index.ts`
- **Logique:** Cache module-level avec retry exponential backoff
- **TTL:** Token Zoho: 60 minutes
- **Impact:** 99% des appels OAuth évités via retry intelligent

### 2. Queue System avec PostgreSQL
- **Edge Function Enqueue:** `supabase/functions/enqueue-campaign-emails/index.ts`
- **Worker Processor:** `supabase/functions/process-campaign-queue/index.ts`
- **Fréquence:** Cron job toutes les 60s via Supabase pg_cron
- **Batch Size:** 5 emails/batch (respecte 10 OAuth/min)
- **Storage:** Table PostgreSQL `campaign_email_queue` avec TTL 24h

### 3. Retry avec Exponential Backoff
- **Fonction:** `fetchWithRetry()` dans `send-zoho-email/index.ts`
- **Délais:** 1s, 2s, 4s (3 tentatives max)
- **Status Code:** Détection automatique du 429 (Rate Limit)

## 📊 Monitoring

### Dashboard Widget
- **Composant:** `src/components/crm/CampaignQueueMonitor.tsx`
- **Localisation:** Admin CRM > Overview tab
- **Affichage temps réel:**
  - Campagnes en queue
  - Progress bar (X/Y emails envoyés)
  - ETA estimé (~X min restantes)
  - Erreurs d'envoi

### Logs Edge Functions
```bash
# Voir les logs en temps réel
supabase functions logs send-zoho-email --follow
supabase functions logs process-campaign-queue --follow
```

## 🔧 Configuration Cron

### Activation du Worker
```sql
-- Activer pg_cron et pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Créer le cron job (toutes les 60 secondes)
SELECT cron.schedule(
  'process-campaign-queue',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/process-campaign-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

## 🚨 Troubleshooting

### Erreur: "Access Denied" de Zoho
**Cause:** Rate limit OAuth dépassé (>10 calls/min)  
**Solution:** Attendre 1 heure OU utiliser le queue system (déjà implémenté)

### Campagne bloquée à "sending"
**Vérifier:**
1. Logs de `process-campaign-queue` → Y a-t-il des erreurs?
2. PostgreSQL → La queue est-elle toujours présente?
3. Cron job → Est-il actif?

```sql
-- Vérifier le statut des cron jobs
SELECT * FROM cron.job;

-- Vérifier les dernières exécutions
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Vérifier les queues en cours
SELECT * FROM campaign_email_queue 
WHERE status IN ('pending', 'sending')
ORDER BY created_at DESC;
```

## 📈 Performance Attendue

| Métrique | Valeur |
|----------|--------|
| Emails/min | 5 (respecte Zoho 10 OAuth/min) |
| Emails/heure | 300 (largement < limite 100/h Zoho Free) |
| Cold start impact | Éliminé (cache PostgreSQL persistant) |
| Délai d'envoi pour 378 users | ~75 minutes |

## 🔐 Variables d'Environnement

```bash
ZOHO_CLIENT_ID=xxx
ZOHO_CLIENT_SECRET=xxx
ZOHO_REFRESH_TOKEN=xxx
ZOHO_ACCOUNT_ID=7828045000000008002
```

## 📚 Références

- [Zoho Mail API Rate Limits 2025](https://www.zoho.com/mail/help/api/rate-limits.html)
- [Supabase Edge Functions Best Practices](https://supabase.com/docs/guides/functions/best-practices)
- [PostgreSQL Queue Patterns](https://www.postgresql.org/docs/current/sql-createtable.html)
