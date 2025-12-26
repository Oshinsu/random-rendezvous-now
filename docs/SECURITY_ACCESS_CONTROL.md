# 🔒 Contrôle d'Accès - Documentation de Sécurité

## Vue d'ensemble

Ce document définit les rôles utilisateurs et leurs niveaux d'accès dans l'application Random.

## Rôles Utilisateurs

### 1. **User** (Utilisateur Normal)
- **Table**: `auth.users`
- **Rôle par défaut**: Aucun rôle spécifique dans `user_roles`
- **Description**: Utilisateur standard de l'application

### 2. **Admin** (Administrateur)
- **Table**: `user_roles` avec `role = 'admin'`
- **Condition**: Email = `garybyss972@gmail.com` (voir fonction `is_admin_user()`)
- **Description**: Accès complet à tous les espaces de l'application

### 3. **Bar Owner** (Gérant de Bar)
- **Table**: `bar_owners` avec `status = 'approved'`
- **Description**: Propriétaire de bar approuvé avec accès à l'espace gérant

---

## Matrice des Accès

| Route | User Normal | Bar Owner Approuvé | Admin | Admin + Bar Owner |
|-------|-------------|-------------------|-------|------------------|
| `/dashboard` | ✅ OUI | ✅ OUI | ✅ OUI | ✅ OUI |
| `/groups` | ✅ OUI | ✅ OUI | ✅ OUI | ✅ OUI |
| `/scheduled-groups` | ✅ OUI | ✅ OUI | ✅ OUI | ✅ OUI |
| `/profile` | ✅ OUI | ✅ OUI | ✅ OUI | ✅ OUI |
| `/referral` | ✅ OUI | ✅ OUI | ✅ OUI | ✅ OUI |
| **`/bar-dashboard`** | ❌ NON | ✅ OUI | ✅ OUI | ✅ OUI |
| **`/bar-application`** | ✅ OUI | ✅ OUI | ✅ OUI | ✅ OUI |
| **`/admin/*`** | ❌ NON | ❌ NON | ✅ OUI | ✅ OUI |

---

## Implémentation Technique

### 1. Hook `useAdminAuth`
**Fichier**: `src/hooks/useAdminAuth.ts`

```typescript
// Vérifie si l'utilisateur est admin via la fonction RPC is_admin_user()
const { isAdmin, loading } = useAdminAuth();
```

### 2. Hook `useBarOwnerAuth`
**Fichier**: `src/hooks/useBarOwnerAuth.ts`

```typescript
// Vérifie si l'utilisateur est un bar owner approuvé
const { isBarOwner, loading } = useBarOwnerAuth();
```

### 3. Composant `AdminRoute`
**Fichier**: `src/components/admin/AdminRoute.tsx`

- Protège les routes `/admin/*`
- Redirige les non-admins vers `/dashboard`

### 4. Composant `BarOwnerRoute`
**Fichier**: `src/components/bar/BarOwnerRoute.tsx`

- Protège la route `/bar-dashboard`
- Autorise les **admins** ET les **bar owners approuvés**
- Les autres utilisateurs voient le formulaire de candidature

### 5. Sidebar Conditionnelle
**Fichier**: `src/components/AppSidebar.tsx`

```typescript
// Lien "Espace Gérant" visible si isBarOwner OU isAdmin
{(isBarOwner || isAdmin) && (
  <NavLink to="/bar-dashboard">Espace Gérant</NavLink>
)}

// Lien "Admin Panel" visible uniquement si isAdmin
{isAdmin && (
  <NavLink to="/admin">Admin Panel</NavLink>
)}
```

---

## Fonctions de Sécurité PostgreSQL

### `is_admin_user()`
```sql
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.id = auth.uid()
      AND u.email = 'garybyss972@gmail.com'
      AND ur.role = 'admin'
  )
$$;
```

### `is_bar_owner()`
```sql
CREATE OR REPLACE FUNCTION public.is_bar_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bar_owners
    WHERE user_id = auth.uid()
      AND status = 'approved'
  )
$$;
```

---

## Principes de Sécurité

### 1. **Defense in Depth** (Défense en Profondeur)
- ✅ Vérification UI (masquage des liens)
- ✅ Vérification côté route (composants de protection)
- ✅ Vérification côté serveur (RLS policies)

### 2. **Least Privilege** (Moindre Privilège)
- Les utilisateurs ne voient que ce à quoi ils ont droit
- Pas de liens visibles vers des pages interdites

### 3. **Separation of Concerns** (Séparation des Responsabilités)
- Admin ≠ Bar Owner (rôles indépendants)
- Un admin peut être bar owner, mais ce sont deux rôles distincts

### 4. **Fail-Safe Defaults** (Sécurité par Défaut)
- Par défaut, l'accès est refusé
- L'accès doit être explicitement accordé

---

## Ajouter un Nouveau Rôle

Pour ajouter un nouveau type d'utilisateur :

1. **Créer un nouveau hook** (ex: `useModeratorAuth.ts`)
2. **Créer une fonction RPC** dans Supabase (ex: `is_moderator_user()`)
3. **Créer un composant de route** (ex: `ModeratorRoute.tsx`)
4. **Ajouter la condition dans la sidebar**
5. **Mettre à jour cette documentation**

---

## Exemples d'Utilisation

### Protéger une nouvelle route
```typescript
<Route path="/special-feature" element={
  <ProtectedRoute>
    <BarOwnerRoute>
      <SpecialFeaturePage />
    </BarOwnerRoute>
  </ProtectedRoute>
} />
```

### Conditionner l'affichage d'un bouton
```typescript
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBarOwnerAuth } from '@/hooks/useBarOwnerAuth';

const MyComponent = () => {
  const { isAdmin } = useAdminAuth();
  const { isBarOwner } = useBarOwnerAuth();
  
  return (
    <>
      {(isBarOwner || isAdmin) && (
        <Button>Action Réservée</Button>
      )}
    </>
  );
};
```

---

## Tests de Sécurité

Pour tester le contrôle d'accès :

1. **User Normal** (`test1@random.fr`)
   - ❌ Ne doit PAS voir "Espace Gérant"
   - ❌ Ne doit PAS voir "Admin Panel"
   - ❌ `/bar-dashboard` → Redirect ou formulaire

2. **Bar Owner Approuvé**
   - ✅ Doit voir "Espace Gérant"
   - ❌ Ne doit PAS voir "Admin Panel"
   - ✅ `/bar-dashboard` → Page gérant

3. **Admin** (`garybyss972@gmail.com`)
   - ✅ Doit voir "Admin Panel"
   - ✅ Doit voir "Espace Gérant" (accès universel)
   - ✅ `/admin/*` → Pages admin
   - ✅ `/bar-dashboard` → Page gérant

---

## Contact

Pour toute question sur le contrôle d'accès, contacter :
- **Email**: garybyss972@gmail.com
- **Rôle**: Super Admin
