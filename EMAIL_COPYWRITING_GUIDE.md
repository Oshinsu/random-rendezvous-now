# Guide de Copywriting Email - Random

## 🎯 Tone of Voice Random

### ADN de la Marque
- **Fun** : On transforme des sorties en aventures
- **Spontané** : Pas de planification lourde
- **Inclusif** : Tout le monde est bienvenu
- **Authentique** : Zéro bullshit corporate
- **Jeune** : Gen Z/Millennial mindset

---

## 📝 Règles d'Or

### ✅ DO

1. **Tutoyer toujours** (sauf mentions légales)
   - ✅ "T'es prêt·e pour ta première sortie ?"
   - ❌ "Vous êtes prêt pour votre première sortie ?"

2. **Émojis stratégiques** (1-3 par email)
   - ✅ "Bienvenue dans la Random fam 🎲✨"
   - ❌ "Bienvenue🎉🔥💯✨🙌🚀👑"

3. **Phrases courtes** (< 20 mots)
   - ✅ "T'es à un clic de rejoindre l'aventure."
   - ❌ "Tu es actuellement en train de te trouver à une distance très réduite de pouvoir enfin rejoindre l'aventure que nous te proposons."

4. **Slang léger mais accessible**
   - ✅ "Check les spots près de chez toi"
   - ✅ "GG pour ta première sortie !"
   - ❌ "Wesh gros viens charbonner"

5. **Authentique et honnête**
   - ✅ "Si Random ne te correspond pas, tu peux te désabonner — aucun souci 👍"
   - ❌ "Tu vas regretter toute ta vie si tu quittes Random"

### ❌ DON'T

1. **Vouvoiement** (sauf footer légal)
2. **Jargon marketing** ("synergie", "écosystème", "solutions")
3. **Culpabilisation** ("Pourquoi tu nous abandonnes ?")
4. **Fausses urgences** ("DERNIÈRE CHANCE !!!" tous les jours)
5. **Chiffres fake** (toujours DB réelle)
6. **Emojis spam** (max 3 par email)

---

## 📐 Structure Email Type

### 1. Subject Line (< 50 caractères)
**Objectif** : 40%+ open rate

**Recette gagnante** :
- Personnalisation : `{{first_name}}`
- Bénéfice clair ou curiosité
- 1 emoji stratégique

**Exemples ✅** :
- "{{first_name}}, bienvenue dans la Random fam 🎲"
- "GG {{first_name}} ! T'as déblocqué : Social Butterfly 🦋"
- "127 personnes actives près de toi RN 👀"

**Exemples ❌** :
- "URGENCE : Votre compte sera supprimé" (alarmiste)
- "Newsletter Random - Édition 47" (boring)
- "🔥🔥🔥 NE RATEZ PAS CETTE OFFRE 🔥🔥🔥" (spam)

---

### 2. Preheader (< 100 caractères)
**Objectif** : Compléter le subject, donner envie d'ouvrir

**Exemples ✅** :
- Subject : "Bienvenue {{first_name}} !"  
  Preheader : "Prêt·e pour ta première aventure Random ? On t'explique tout en 2 min"

- Subject : "T'es sur une série de fou 🔥"  
  Preheader : "{{total_outings}} sorties déjà ! T'es dans le top 15% de la communauté"

---

### 3. Hero Section
**Objectif** : Capter l'attention immédiatement

**Éléments** :
- 1 emoji géant (64px) ou visuel fort
- Titre accrocheur (< 10 mots)
- Sous-titre explicatif (< 20 mots)

**Exemple** :
```html
<div class="emoji-hero">🎲✨</div>
<h1>Bienvenue {{first_name}} ! 🎉</h1>
<p>T'es officiellement dans la Random fam</p>
```

---

### 4. Body Content
**Objectif** : Expliquer/convaincre/célébrer en < 100 mots

**Structure** :
1. Contexte (pourquoi tu reçois cet email)
2. Bénéfice/Info principale
3. Social proof ou data (si pertinent)
4. Transition vers CTA

**Exemple** :
```
T'es officiellement dans la Random fam — l'app qui transforme tes sorties en aventures spontanées.

🎯 Créer un groupe en 30 secondes
🔥 Matcher avec 5 personnes près de toi
🍹 Découvrir un bar automatiquement assigné

Pas de planning compliqué, pas de "qui choisit le bar ?"... juste toi, 4 nouveaux potes, et un spot cool.
```

---

### 5. Call-to-Action (CTA)
**Objectif** : > 15% click rate

**Best practices** :
- 1 CTA principal visible (bouton large)
- Action verb + bénéfice
- Contraste fort (couleur brand)
- Répété si email long (top + bottom)

**Exemples ✅** :
- "🚀 Voir les bars près de moi"
- "🎁 Récupérer mes crédits"
- "🔍 Découvrir les nouveautés"

**Exemples ❌** :
- "Cliquer ici" (pas de contexte)
- "En savoir plus" (trop vague)
- 5 CTAs différents (confusion)

---

### 6. Footer
**Obligatoire légal** :
- Nom entreprise
- Lien unsubscribe visible
- Contact (optionnel)

**Exemple** :
```html
<div class="footer">
  <p>Random © 2025</p>
  <a href="{{unsubscribe_url}}">Se désabonner</a>
</div>
```

---

## 🎨 Variables Dynamiques

### Variables de Base (toujours disponibles)
```
{{first_name}}         → Prénom user
{{email}}              → Email user
{{user_id}}            → UUID
{{unsubscribe_url}}    → Lien désabonnement
```

### Variables Comportementales
```
{{total_outings}}              → Nombre sorties
{{days_since_signup}}          → Ancienneté
{{days_since_last_activity}}   → Inactivité
{{last_bar_visited}}           → Dernier bar
```

### Variables Contextuelles (temps réel)
```
{{active_users}}       → Users actifs maintenant
{{forming_groups}}     → Groupes en formation
{{new_bars}}           → Nouveaux bars cette semaine
{{current_time}}       → Heure actuelle (ex: "18h32")
```

### Variables Calculées
```
{{percentile}}         → Classement vs communauté
{{bars_visited}}       → Bars uniques découverts
{{people_met}}         → Estimation personnes rencontrées
```

---

## 📊 Exemples Campagne Complète

### Exemple 1 : Welcome Fun

**Subject** : `{{first_name}}, bienvenue dans la Random fam 🎲✨`

**Preheader** : `Prêt·e pour ta première aventure Random ? On t'explique tout en 2 min`

**Body** :
```
🎲✨

Bienvenue {{first_name}} ! 🎉

T'es officiellement dans la Random fam — l'app qui transforme tes sorties en aventures spontanées.

🎯 Créer un groupe en 30 secondes
🔥 Matcher avec 5 personnes près de toi
🍹 Découvrir un bar automatiquement assigné

Pas de planning compliqué, pas de "qui choisit le bar ?"... juste toi, 4 nouveaux potes, et un spot cool.

[CTA : 🚀 Voir les bars près de moi]

PS : Les meilleurs moments arrivent quand on ne les planifie pas 😉
```

**Tone** : Excité, encourageant, éducatif

---

### Exemple 2 : FOMO Smart

**Subject** : `{{active_users}} personnes actives près de toi RN 👀🔥`

**Preheader** : `C'est maintenant ou jamais ! {{forming_groups}} groupes se forment dans les 30 min`

**Body** :
```
🔥 C'EST MAINTENANT !

🟢 LIVE : {{current_time}}

📍 Dans ton quartier maintenant :

• 🟢 {{active_users}} utilisateurs actifs en ce moment
• 🍻 {{forming_groups}} groupes se forment dans les 30 min
• ⭐ {{top_bar}} ({{rating}}★) - {{available_spots}} places restantes

⏰ Rejoins un groupe avant {{deadline}} !

[CTA : 🎯 Voir les groupes actifs]

Après 20h30, c'est trop tard 😉
```

**Tone** : Urgence positive, FOMO, données temps réel

---

### Exemple 3 : Last Call Friendly

**Subject** : `{{first_name}}, une dernière ? 🍹 (on insiste pas après)`

**Preheader** : `Offre drink offert + feedback demandé. Si ça te dit pas, on comprend 👍`

**Body** :
```
🤔

Hey {{first_name}}, tout va bien ?

On a remarqué que t'as pas encore testé Random... et on se demandait pourquoi ?

🤷 Peut-être que...
• T'as pas trouvé de groupe intéressant ?
• T'hésites à rejoindre des inconnus ?
• Tu préfères sortir autrement ?

On aimerait vraiment comprendre ! 💬

---

🎁 OFFRE DERNIÈRE CHANCE

Teste Random cette semaine et reçois un drink offert dans un bar partenaire*

[CTA : 🍹 Récupérer mon offre]
[Lien secondaire : 💬 Plutôt donner mon avis]

*Offre valable 7 jours, voir conditions sur l'app

Si Random ne te correspond vraiment pas, tu peux te désabonner ici — aucun souci 👍
```

**Tone** : Empathique, honnête, non culpabilisant

---

## ✅ Checklist Avant Envoi

### Contenu
- [ ] Subject line < 50 caractères
- [ ] Preheader < 100 caractères
- [ ] Tutoiement partout
- [ ] Max 3 émojis
- [ ] 1 CTA principal clair
- [ ] Variables `{{}}` testées
- [ ] Pas de fake data
- [ ] Ton aligné avec campagne

### Technique
- [ ] HTML responsive (mobile-first)
- [ ] Images avec alt text
- [ ] Liens trackés
- [ ] Unsubscribe visible
- [ ] Test envoi perso OK
- [ ] Preview desktop + mobile

### Légal
- [ ] Nom entreprise dans footer
- [ ] Adresse postale (si commercial)
- [ ] Lien désabonnement 1-clic
- [ ] RGPD compliant

---

## 🔄 Optimisation Continue

### A/B Tests Systématiques

**Subject Lines** :
- Avec vs sans emoji
- Question vs affirmation
- Personnalisation vs générique

**CTAs** :
- Verbe d'action différent
- Couleur bouton
- Position (top vs bottom vs les 2)

**Longueur** :
- Court (< 100 mots) vs Long (> 200 mots)

### Métriques à Surveiller

**Open Rate** :
- Objectif : > 35%
- Si < 25% → Tester subject lines

**Click Rate** :
- Objectif : > 15%
- Si < 10% → Review CTA et value proposition

**Unsubscribe Rate** :
- Acceptable : < 2%
- Si > 3% → Réduire fréquence ou revoir tone

---

## 🚨 Red Flags Copywriting

### Signes d'un Mauvais Email

❌ **Corporate zombie** : "Nous sommes ravis de vous informer..."  
❌ **Spam vibes** : "GAGNEZ 1 MILLION D'EUROS !!!"  
❌ **Culpabilisant** : "Vous nous manquez tellement..."  
❌ **Fausse urgence** : "EXPIRE DANS 2 MINUTES" (tous les jours)  
❌ **Trop long** : > 300 mots sans raison  
❌ **Aucun CTA** : User doit deviner quoi faire

---

**Dernière mise à jour** : Octobre 2025  
**Owner** : Marketing Team
