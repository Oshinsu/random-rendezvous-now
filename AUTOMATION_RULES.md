# Règles d'Automation CRM - Random

## 📋 Vue d'Ensemble

7 campagnes automatisées alignées sur le parcours utilisateur :
- **Welcome Flow** : J0-7 (éducation)
- **Activation Flow** : Post-actions (célébration)
- **Retention Flow** : Contexte temps réel (FOMO)
- **Re-engagement Flow** : J14+ (win-back bienveillant)

---

## 🎬 Welcome Flow

### 1. Welcome Fun (J0 - Immédiat)

**Campagne** : `Welcome Fun`  
**Trigger** : Inscription complétée  
**Condition** :
```json
{
  "stage": "new_user",
  "days_since_signup": 0
}
```

**Timing** : Immédiat (delay 0 min)  
**Canaux** : Email + In-app  
**Priority** : 10 (highest)

**Objectif** : Expliquer le concept, lever les freins, montrer que c'est facile  
**KPI** : Taux d'ouverture > 40%

**Variables dynamiques** :
- `{{first_name}}` : Prénom user

---

### 2. Gentle Nudge (J3 - Si pas d'action)

**Campagne** : `Gentle Nudge`  
**Trigger** : Comportemental  
**Condition** :
```json
{
  "days_since_signup": 3,
  "total_groups_created": 0
}
```

**Timing** : J3 exactement  
**Canaux** : Email + In-app  
**Priority** : 8

**Exclusions** :
- Users ayant déjà créé un groupe
- Users ayant unsubscribe

**Objectif** : Montrer l'activité, créer FOMO léger  
**KPI** : Taux de création groupe > 15%

**Variables dynamiques** :
- `{{first_name}}`
- `{{active_groups}}` : Groupes formés cette semaine
- `{{new_bars}}` : Nouveaux bars ajoutés
- `{{successful_outings}}` : Sorties réussies

---

## 🚀 Activation Flow

### 3. First Win Celebration (Post 1ère sortie)

**Campagne** : `First Win Celebration`  
**Trigger** : Lifecycle change  
**Condition** :
```json
{
  "total_outings": 1,
  "trigger": "first_completion"
}
```

**Timing** : 2h après completion du groupe  
**Canaux** : Email + In-app  
**Priority** : 9

**Objectif** : Célébrer, gamification, pousser referral  
**KPI** : Taux de referral activation > 20%

**Variables dynamiques** :
- `{{first_name}}`
- Badge "Social Butterfly" débloqué

---

### 4. Streak Builder (2-3 sorties)

**Campagne** : `Streak Builder`  
**Trigger** : Comportemental  
**Condition** :
```json
{
  "total_outings_min": 2
}
```

**Timing** : Immédiat après 2ème sortie validée  
**Canaux** : Email + In-app  
**Priority** : 7

**Objectif** : Renforcer l'habitude, stats perso, compétition fun  
**KPI** : Taux de 3ème sortie < 7 jours > 30%

**Variables dynamiques** :
- `{{first_name}}`
- `{{total_outings}}` : Nombre sorties
- `{{percentile}}` : Classement vs communauté
- `{{bars_visited}}` : Nombre de bars uniques
- `{{people_met}}` : Estimation personnes rencontrées (outings × 4)

---

## 🔥 Retention Flow

### 5. FOMO Smart (Peak Hours)

**Campagne** : `FOMO Smart`  
**Trigger** : Time-based + comportemental  
**Condition** :
```json
{
  "schedule": "Thu,Fri,Sat 18:00-20:30",
  "user_inactive_this_week": true
}
```

**Timing** : Jeudi/Vendredi/Samedi entre 18h-20h30  
**Canaux** : Push + In-app (email en backup si push désactivé)  
**Priority** : 10

**Exclusions** :
- Users ayant déjà un groupe actif aujourd'hui
- Users marqués "do_not_disturb"

**Objectif** : Convertir temps réel, urgence positive  
**KPI** : Taux de création groupe dans l'heure > 10%

**Variables dynamiques** :
- `{{first_name}}`
- `{{active_users}}` : Users actifs en temps réel (rayon 5km)
- `{{forming_groups}}` : Groupes en formation maintenant
- `{{top_bar}}` : Bar le plus populaire ce soir
- `{{rating}}` : Note du bar
- `{{available_spots}}` : Places restantes
- `{{current_time}}` : Heure actuelle
- `{{deadline}}` : 20h30

---

## 🔄 Re-engagement Flow

### 6. Comeback Cool (J14-45 inactif)

**Campagne** : `Comeback Cool`  
**Trigger** : Inactivité  
**Condition** :
```json
{
  "days_since_last_activity_min": 14,
  "days_since_last_activity_max": 45,
  "had_at_least_one_outing": true
}
```

**Timing** : Dès franchissement du seuil 14 jours  
**Canaux** : Email + In-app  
**Priority** : 6

**Exclusions** :
- Users n'ayant jamais fait de sortie (segment différent)

**Objectif** : Win-back soft, montrer les nouveautés  
**KPI** : Taux de comeback > 20%

**Variables dynamiques** :
- `{{first_name}}`
- `{{new_bars}}` : Bars ajoutés pendant absence
- `{{new_features}}` : Features lancées
- `{{total_users}}` : Croissance communauté

---

### 7. Last Call Friendly (J45+)

**Campagne** : `Last Call Friendly`  
**Trigger** : Inactivité longue  
**Condition** :
```json
{
  "days_since_signup_min": 45,
  "total_outings": 0
}
```

**Timing** : Dès franchissement du seuil 45 jours  
**Canaux** : Email uniquement  
**Priority** : 5

**Particularités** :
- Dernière communication avant nettoyage base
- Unsubscribe ultra visible
- Option feedback demandée
- Incentive pour dernier essai

**Objectif** : Ultime tentative + feedback qualitatif  
**KPI** : Taux de réactivation > 10% OU taux de feedback > 5%

**Variables dynamiques** :
- `{{first_name}}`

---

## 🔧 Configuration Technique

### Triggers Types

1. **Lifecycle** : Changement de stage utilisateur
   - Exemple : new_user → activated
   
2. **Behavior** : Action spécifique détectée
   - Exemple : total_outings passe à 2

3. **Time-based** : Horaires programmés
   - Exemple : Jeudi 18h
   
4. **Inactivity** : Seuils d'inactivité franchis
   - Exemple : 14 jours sans activité

### Exclusions Globales

**Tous les emails excluent automatiquement** :
- Users avec `unsubscribed = true` dans `crm_unsubscribes`
- Users avec email bounce permanent
- Users marqués `spam_complaint = true`

### Rate Limiting

**Fréquence maximale par user** :
- Max 2 emails/jour
- Max 5 emails/semaine
- Max 10 push/semaine
- Délai min entre 2 emails identiques : 7 jours

---

## 📊 Monitoring & Alertes

### Métriques à Tracker (Quotidien)

```sql
-- Dashboard automation
SELECT 
  r.rule_name,
  COUNT(*) as executions_24h,
  COUNT(*) FILTER (WHERE e.campaign_sent = true) as successful_sends,
  COUNT(*) FILTER (WHERE e.send_status = 'failed') as failures,
  ROUND(100.0 * COUNT(*) FILTER (WHERE e.campaign_sent = true) / NULLIF(COUNT(*), 0), 2) as success_rate
FROM crm_automation_executions e
JOIN crm_automation_rules r ON e.rule_id = r.id
WHERE e.triggered_at >= NOW() - INTERVAL '24 hours'
GROUP BY r.rule_name;
```

### Alertes Automatiques

**🚨 Critique (action immédiate)** :
- Taux d'envoi < 80% → Vérifier credentials Zoho
- Bounce rate > 5% → Audit liste emails
- Spam complaint > 0.1% → Review copywriting

**⚠️ Warning (review sous 24h)** :
- Taux d'ouverture < 25% → A/B test subject lines
- Taux de clic < 10% → Review CTAs
- Unsubscribe rate > 2% → Réduire fréquence

---

## 🔄 A/B Testing

### Tests Actifs (1 à la fois)

Utiliser table `ab_tests` :

```sql
INSERT INTO ab_tests (
  campaign_id, 
  variant_a_subject, 
  variant_b_subject,
  status
) VALUES (
  (SELECT id FROM crm_campaigns WHERE campaign_name = 'Welcome Fun'),
  '{{first_name}}, bienvenue dans la Random fam 🎲✨',
  '{{first_name}}, t''es prêt·e pour ton premier bar Random ?',
  'active'
);
```

**Winner déclaré après** : 200 envois minimum par variante

---

## 📝 Checklist Pré-Lancement Campagne

- [ ] Subject line < 50 caractères
- [ ] Preheader rempli (< 100 caractères)
- [ ] Variables `{{}}` toutes définies
- [ ] CTA principal visible mobile
- [ ] Unsubscribe link présent
- [ ] Test envoi manuel OK
- [ ] Segment target correctement assigné
- [ ] Rate limiting configuré
- [ ] Exclusions vérifiées

---

**Dernière mise à jour** : Octobre 2025
**Owner** : CRM Team
