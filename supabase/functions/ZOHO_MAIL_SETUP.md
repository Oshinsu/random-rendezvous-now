# Configuration Zoho Mail pour Random CRM

## Prérequis

1. **Compte Zoho Mail** (gratuit ou payant)
2. **Domaine vérifié** sur Zoho Mail (randomapp.fr)
3. **Accès à l'API Zoho** (OAuth 2.0)

---

## Étape 1 : Créer une application OAuth dans Zoho

### 1.1 Accéder à la console API Zoho
- Aller sur : https://api-console.zoho.eu/
- Se connecter avec votre compte Zoho

### 1.2 Créer un nouveau client
1. Cliquer sur **"Add Client"**
2. Sélectionner **"Server-based Applications"**
3. Remplir les informations :
   - **Client Name** : `Random CRM`
   - **Homepage URL** : `https://randomapp.fr`
   - **Authorized Redirect URIs** : `https://randomapp.fr/oauth/callback`

### 1.3 Noter les credentials
Une fois créé, vous obtiendrez :
- ✅ **Client ID** (ex: `1000.XXXXXXXXXXXXXXXX`)
- ✅ **Client Secret** (ex: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

---

## Étape 2 : Générer le Refresh Token

### 2.1 Générer le code d'autorisation
Ouvrir cette URL dans votre navigateur (remplacer `YOUR_CLIENT_ID`) :

```
https://accounts.zoho.eu/oauth/v2/auth?scope=ZohoMail.messages.CREATE,ZohoMail.accounts.READ&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=https://randomapp.fr/oauth/callback
```

### 2.2 Accepter les permissions
- Cliquer sur **"Accept"**
- Vous serez redirigé vers : `https://randomapp.fr/oauth/callback?code=XXXXXXXXX`
- ✅ **Copier le code** (après `?code=`)

### 2.3 Échanger le code contre un refresh token
Exécuter cette commande **curl** (remplacer les valeurs) :

```bash
curl -X POST https://accounts.zoho.eu/oauth/v2/token \
  -d "code=VOTRE_CODE_DAUTORISATION" \
  -d "client_id=VOTRE_CLIENT_ID" \
  -d "client_secret=VOTRE_CLIENT_SECRET" \
  -d "redirect_uri=https://randomapp.fr/oauth/callback" \
  -d "grant_type=authorization_code"
```

**Réponse attendue :**
```json
{
  "access_token": "1000.xxx",
  "refresh_token": "1000.yyy",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

✅ **Copier le `refresh_token`** (commence par `1000.`)

---

## Étape 3 : Récupérer l'Account ID

### 3.1 Obtenir un access token temporaire
```bash
curl -X POST https://accounts.zoho.eu/oauth/v2/token \
  -d "refresh_token=VOTRE_REFRESH_TOKEN" \
  -d "client_id=VOTRE_CLIENT_ID" \
  -d "client_secret=VOTRE_CLIENT_SECRET" \
  -d "grant_type=refresh_token"
```

### 3.2 Lister les comptes mail
```bash
curl -X GET "https://mail.zoho.eu/api/accounts" \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

**Réponse attendue :**
```json
{
  "data": [
    {
      "accountId": "123456789",
      "accountName": "noreply@randomapp.fr",
      "primaryEmailAddress": "noreply@randomapp.fr"
    }
  ]
}
```

✅ **Copier l'`accountId`**

---

## Étape 4 : Configurer les secrets Supabase

### 4.1 Aller dans les Edge Functions secrets
- Dashboard Supabase : https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/settings/functions

### 4.2 Ajouter les 4 secrets

| Secret Name | Valeur |
|------------|--------|
| `ZOHO_CLIENT_ID` | `1000.XXXXXXXXXXXXXXXX` |
| `ZOHO_CLIENT_SECRET` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `ZOHO_REFRESH_TOKEN` | `1000.YYYYYYYYYYYYYYYY` |
| `ZOHO_ACCOUNT_ID` | `123456789` |

---

## Étape 5 : Vérifier le domaine (CRITIQUE)

### 5.1 Accéder aux paramètres de domaine
- Aller sur : https://mail.zoho.eu/zm/#settings/domains

### 5.2 Ajouter randomapp.fr
1. Cliquer sur **"Add Domain"**
2. Entrer : `randomapp.fr`
3. Suivre les instructions de vérification DNS

### 5.3 Configurer SPF, DKIM, DMARC
**SPF Record (obligatoire) :**
```
Type: TXT
Host: @
Value: v=spf1 include:zoho.eu ~all
```

**DKIM Record (recommandé) :**
```
Type: TXT
Host: zmail._domainkey
Value: [fourni par Zoho après validation]
```

**DMARC Record (recommandé) :**
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@randomapp.fr
```

⚠️ **Sans domaine vérifié, les emails seront bloqués !**

---

## Étape 6 : Tester l'intégration

### 6.1 Via l'Admin CRM
1. Aller sur `/admin/crm`
2. Onglet **"Campaigns"**
3. Créer une campagne de test
4. L'envoyer à un email de test

### 6.2 Via Supabase Functions logs
```bash
# Logs de send-zoho-email
https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/functions/send-zoho-email/logs

# Logs de lifecycle-automations
https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/functions/lifecycle-automations/logs
```

---

## Scopes Zoho Mail utilisés

| Scope | Description |
|-------|-------------|
| `ZohoMail.messages.CREATE` | Envoyer des emails |
| `ZohoMail.accounts.READ` | Lire les infos du compte |

---

## Limites API Zoho Mail

| Plan | Envois/jour | Envois/heure |
|------|-------------|--------------|
| **Free** | 250 | 50 |
| **Mail Lite** | 1,000 | 200 |
| **Mail Premium** | 5,000 | 500 |

⚠️ **Surveiller les quotas pour éviter les blocages**

---

## Troubleshooting

### ❌ "Invalid refresh token"
- Le refresh token a expiré (rare mais possible)
- **Solution** : Régénérer un nouveau refresh token (Étape 2)

### ❌ "Domain not verified"
- Le domaine randomapp.fr n'est pas vérifié dans Zoho
- **Solution** : Vérifier le domaine (Étape 5)

### ❌ "Authentication failed"
- Client ID ou Secret incorrect
- **Solution** : Vérifier les secrets dans Supabase

### ❌ "Account not found"
- L'Account ID est incorrect
- **Solution** : Relister les comptes (Étape 3.2)

---

## Sécurité

✅ **Bonnes pratiques :**
- ✅ Secrets stockés dans Supabase (chiffrés)
- ✅ OAuth 2.0 avec refresh token
- ✅ Pas d'access token stocké (régénéré à chaque appel)
- ✅ Edge Functions isolées (service_role uniquement)

❌ **À éviter :**
- ❌ Ne jamais stocker les secrets dans le code
- ❌ Ne jamais exposer le refresh token côté client
- ❌ Ne jamais partager le Client Secret

---

## Support

- **Documentation Zoho Mail API** : https://www.zoho.com/mail/help/api/
- **Console API Zoho** : https://api-console.zoho.eu/
- **Support Zoho** : https://help.zoho.com/portal/en/home

---

✅ **Configuration terminée ! Les emails peuvent maintenant être envoyés via Zoho Mail.**
