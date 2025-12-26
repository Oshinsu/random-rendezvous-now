# 📘 Guide Admin CRM - Random App

## 🎯 Vue d'ensemble

Le système CRM de Random App permet de gérer l'engagement des utilisateurs à travers:
- **Campagnes email** automatisées via Zoho Mail
- **Segmentation utilisateur** dynamique
- **Health scores** pour détecter les risques de churn
- **Automation rules** pour déclencher des actions

---

## 📧 Gestion des Campagnes

### Créer une campagne

1. **Aller dans l'onglet "Campagnes"**
2. **Remplir le formulaire:**
   - Nom de la campagne
   - Sélectionner un segment cible (obligatoire)
   - Subject et contenu de l'email
   - Date d'envoi (optionnel pour envoi immédiat)

3. **Cliquer sur "Créer la campagne"**

### Envoyer une campagne

- **Bouton "Envoyer"**: Lance l'envoi immédiat
  - Campagnes < 10 destinataires: envoi direct
  - Campagnes ≥ 10 destinataires: mise en queue automatique

### Voir les détails d'une campagne

- **Bouton "Détails"**: Affiche les statistiques
  - Taux d'ouverture
  - Taux de clic
  - Conversions

### Supprimer une campagne

- **Bouton rouge (poubelle)**: Supprime la campagne
  - ⚠️ Supprime aussi de la queue si en cours d'envoi

---

## 📊 Monitoring en temps réel

### Widget "Queue des Campagnes"

Affiche l'état des envois en cours:
- **Progress bar**: % d'emails envoyés
- **Temps restant**: Estimation basée sur 5 emails/min
- **Erreurs**: Lien direct vers les logs si échecs

### Dashboard de santé CRM

3 indicateurs clés:

1. **Zoho Mail API**
   - ✅ Opérationnel si token caching actif
   - Rate limit: 5 emails/min via queue

2. **Automation Rules**
   - Vérifie que toutes les rules actives ont une campagne assignée
   - ⚠️ Attention si rules sans campagne

3. **Health Score Moyen**
   - 🚨 Critique (< 35): Lancez campagnes de réactivation
   - ⚠️ Warning (35-50): Surveillez l'engagement
   - ✅ Bon (> 50): Base saine

---

## 🔧 Troubleshooting

### Campagne bloquée en "sending"

**Causes possibles:**
1. Edge function `process-campaign-queue` non démarrée
   - Vérifier: `supabase/config.toml` → CRON configuré
2. Rate limit Zoho atteint (100 emails/heure)
   - Attendre 1h ou contacter support

**Solution:**
1. Vérifier les logs: `/admin/logs`
2. Rechercher: `campaign+[ID_CAMPAGNE]`

### Emails non reçus

**Vérifier dans l'ordre:**
1. Campagne en statut "sent" dans l'onglet Campagnes
2. Widget "Queue": progression = 100%
3. Logs Zoho: `/admin/logs` → Rechercher "zoho"
4. Spam: Demander au destinataire de vérifier

### Erreurs "429 Too Many Requests"

- Zoho limite: **100 emails/heure** + **5 emails/min**
- Le système gère automatiquement avec retry exponentiel
- Si persistant: attendre 60 minutes

---

## 📅 Bonnes pratiques

### Timing optimal

- Utiliser l'optimisation d'heure d'envoi:
  - Données affichées sous le sélecteur de segment
  - Basé sur l'historique d'engagement du segment

### Segmentation efficace

- Créer des segments pertinents:
  - "Nouveaux inscrits" (< 7 jours)
  - "Utilisateurs actifs" (groupes récents)
  - "At Risk" (health score < 35)

### Éviter le spam

- ❌ Ne pas envoyer > 2 emails/semaine par user
- ✅ Personnaliser avec variables: `{{user_name}}`, `{{credits}}`
- ✅ Tester avec 1 user avant envoi massif

---

## 🔐 Limites système

### Zoho Mail API

- **100 emails/heure** par compte
- **5 emails/min** (géré par la queue)
- Token valide 1h (cache automatique)

### Queue PostgreSQL

- Retention: 24h (auto-cleanup)
- Batch size: 5 emails à la fois
- Processing: toutes les 60 secondes (CRON)

### Database

- RLS activé: Admin uniquement
- Logs conservés 30 jours

---

## 📞 Support

En cas de problème critique:

1. Consulter `/admin/logs`
2. Vérifier le monitoring dashboard
3. Exporter les données (bouton "Export CSV")
4. Contacter le dev avec:
   - ID de la campagne
   - Timestamp de l'erreur
   - Capture d'écran des logs

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-10-31
