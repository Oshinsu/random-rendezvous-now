

# Plan de Correction des Bugs Critiques

## Bugs Identifiés

### Bug 1: Erreur de parsing Edge Function `refresh-zoho-token`
**Fichier:** `supabase/functions/refresh-zoho-token/index.ts`  
**Erreur:** `Expression expected at line 15:26`  
**Cause:** Le commentaire à la ligne 15 contient `*/45 * * * *` qui est interprété comme une fin de commentaire multi-ligne (`*/`) suivie de code invalide.

```text
Ligne problématique:
* CRON Schedule: */45 * * * * (every 45 min, tokens expire at 59min)
                 ^^
                 Deno interprète */ comme fin de commentaire
```

### Bug 2: Propriétés inexistantes sur type `BarOwner`
**Fichiers:** `AdminBarOwners.tsx` (lignes 295, 299) et `AdminBarOwnersNew.tsx` (lignes 295, 299)  
**Erreurs:**
- `owner_name` n'existe pas sur type `BarOwner`
- `phone_number` n'existe pas sur type `BarOwner`

**Analyse du schéma DB `bar_owners`:**
| Colonne existante | Colonne utilisée (erreur) |
|------------------|---------------------------|
| `business_name` | `owner_name` ❌ |
| `contact_phone` | `phone_number` ❌ |

Le code utilise `owner_name` et `phone_number` mais la table contient `business_name` et `contact_phone`.

---

## Corrections à Appliquer

### Correction 1: Edge Function `refresh-zoho-token/index.ts`

**Modification ligne 15:** Échapper le caractère `*` dans le pattern CRON pour éviter la confusion avec la fin de commentaire.

```typescript
// AVANT (ligne 15):
 * CRON Schedule: */45 * * * * (every 45 min, tokens expire at 59min)

// APRÈS:
 * CRON Schedule: Every 45 minutes (tokens expire at 59min)
```

### Correction 2: `AdminBarOwners.tsx` (2 lignes)

**Ligne 295:** Remplacer `owner.owner_name` par rien (doublon avec business_name déjà affiché)
**Ligne 299:** Remplacer `owner.phone_number` par `owner.contact_phone`

```tsx
// AVANT (ligne 295):
<div className="text-sm text-gray-500">{owner.owner_name}</div>

// APRÈS: Supprimer car business_name est déjà affiché au-dessus

// AVANT (ligne 299):
<div className="text-sm text-gray-500">{owner.phone_number}</div>

// APRÈS:
<div className="text-sm text-gray-500">{owner.contact_phone}</div>
```

### Correction 3: `AdminBarOwnersNew.tsx` (2 lignes)

Mêmes corrections que pour `AdminBarOwners.tsx` aux lignes 295 et 299.

---

## Résumé des Fichiers à Modifier

| Fichier | Lignes | Action |
|---------|--------|--------|
| `supabase/functions/refresh-zoho-token/index.ts` | 15 | Reformuler le commentaire CRON |
| `src/pages/admin/AdminBarOwners.tsx` | 295, 299 | Corriger propriétés BarOwner |
| `src/pages/admin/AdminBarOwnersNew.tsx` | 295, 299 | Corriger propriétés BarOwner |

---

## Détails Techniques

### Pourquoi le bug du commentaire JSDoc se produit
Le parser Deno interprète `*/` dans le commentaire comme la fin du bloc JSDoc, puis tente de parser `45 * * * * (every...` comme du code JavaScript, ce qui échoue.

### Propriétés correctes selon le schéma DB
```typescript
interface BarOwner {
  id: string;
  user_id: string;
  business_name: string;    // ✅ Nom de l'entreprise/gérant
  contact_email: string;
  contact_phone?: string;   // ✅ Numéro de téléphone
  bar_place_id?: string;
  bar_name: string;
  bar_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verification_documents: any;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}
```

Les propriétés `owner_name` et `phone_number` n'existent pas dans le schéma.

