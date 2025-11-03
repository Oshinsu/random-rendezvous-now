# 🔧 Débloquer la géolocalisation sur www.random-app.fr

## Pourquoi ma géolocalisation ne fonctionne pas ?

Après un changement de domaine (de `random-app.fr` vers `www.random-app.fr`), les navigateurs réinitialisent automatiquement les permissions de sécurité, y compris la géolocalisation. C'est une mesure de sécurité normale.

---

## 📱 Guide de déblocage par navigateur

### Chrome / Edge / Brave
1. **Clique sur l'icône 🔒 dans la barre d'adresse** (à gauche de l'URL)
2. Clique sur **"Paramètres du site"** ou **"Autorisations"**
3. Cherche **"Position"** ou **"Localisation"**
4. Sélectionne **"Autoriser"**
5. **Recharge la page** (appuie sur `F5` ou `Ctrl+R`)

**OU via les paramètres Chrome** :
1. Va sur `chrome://settings/content/siteDetails?site=https://www.random-app.fr`
2. Cherche "Position" et sélectionne "Autoriser"
3. Recharge la page

---

### Firefox
1. **Clique sur l'icône 🛡️ dans la barre d'adresse** (à gauche de l'URL)
2. Clique sur **"Permissions"** ou **"Connexion sécurisée"**
3. Cherche **"Accéder à votre position"**
4. **Coche la case** pour autoriser
5. **Recharge la page** (appuie sur `F5` ou `Ctrl+R`)

**OU via les paramètres Firefox** :
1. Outils → Paramètres → Vie privée et sécurité
2. Cherche "Autorisations" → "Position" → "Paramètres"
3. Autorise `www.random-app.fr`
4. Recharge la page

---

### Safari (macOS)
1. **Safari** → **Préférences** (ou `Cmd+,`)
2. Onglet **"Sites web"**
3. Clique sur **"Position"** dans la barre latérale gauche
4. Trouve `www.random-app.fr` dans la liste
5. Change le statut à **"Autoriser"**
6. **Recharge la page** (appuie sur `Cmd+R`)

---

### Safari (iOS / iPhone / iPad)
1. **Réglages** → **Safari** → **Avancé** → **Données de sites web**
2. Trouve `www.random-app.fr` et supprime-le
3. **Retourne sur le site** dans Safari
4. Lorsque la popup de permission apparaît, clique sur **"Autoriser"**

**OU réinitialise complètement Safari** :
1. **Réglages** → **Safari**
2. **Effacer historique, données de site**
3. Confirme
4. Retourne sur `www.random-app.fr` et autorise la géolocalisation

---

## 🔄 Reset complet du cache SSL (si le problème persiste)

### Chrome
```
chrome://settings/content/siteDetails?site=https://www.random-app.fr
```
→ Clique sur **"Effacer les données"** → Recharge la page

### Firefox
1. `Ctrl+Shift+Del` (ou `Cmd+Shift+Del` sur Mac)
2. Coche **"Cache"** et **"Permissions du site"**
3. Clique sur **"Effacer maintenant"**
4. Recharge `www.random-app.fr`

### Safari
1. Safari → Développement → Vider les caches
2. OU `Cmd+Option+E`
3. Recharge la page

---

## ✅ Comment vérifier que ça marche ?

1. Va sur `https://www.random-app.fr`
2. Clique sur le bouton **"Groupe Frais"**
3. **Tu devrais voir** :
   - Une popup de demande de permission (si première fois)
   - OU un chargement suivi de "Groupe trouvé près de [ta ville]"

Si tu vois **"⏱️ Géolocalisation lente"** :
- Attends 30 secondes (le système essaie automatiquement un fallback)
- Active le GPS de ton appareil si tu es sur mobile
- Vérifie ta connexion Internet

Si tu vois **"🚫 Géolocalisation bloquée"** :
- Suis les étapes ci-dessus pour ton navigateur
- Recharge la page après avoir autorisé

---

## 🆘 Problème toujours présent ?

**Vérifie ces points** :
- ✅ Tu es bien sur `https://www.random-app.fr` (avec `www`)
- ✅ Ton GPS est activé (sur mobile)
- ✅ Tu as une connexion Internet stable
- ✅ Tu as autorisé la géolocalisation dans les paramètres du navigateur

**Si rien ne fonctionne** :
1. Essaye avec un **autre navigateur** (Chrome, Firefox, Safari)
2. Essaye en **navigation privée** (pour vérifier si ce n'est pas une extension qui bloque)
3. Redémarre ton appareil

---

## 📚 Sources officielles

- [Chrome: Gérer les paramètres de localisation](https://support.google.com/chrome/answer/142065)
- [Firefox: Permissions](https://support.mozilla.org/fr/kb/permissions-firefox-sites-web)
- [Safari: Confidentialité et sécurité](https://support.apple.com/fr-fr/guide/safari/sfri40732/mac)
- [MDN: Geolocation API](https://developer.mozilla.org/fr/docs/Web/API/Geolocation_API)
