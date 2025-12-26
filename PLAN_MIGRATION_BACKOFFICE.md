# 📋 PLAN DE MIGRATION BACK OFFICE - RANDOM 2025

**Date:** 19 novembre 2025  
**Objectif:** Consolider les fichiers dupliqués et migrer vers les versions "New" (SOTA 2025)

---

## 🎯 DÉCISIONS DE MIGRATION

### ✅ Migrations à Effectuer

| Ancien Fichier | Nouveau Fichier | Décision | Raison |
|----------------|-----------------|----------|--------|
| `AdminActivity.tsx` | `AdminActivityNew.tsx` | ✅ Migrer vers New | Date Picker + Recharts + PieChart |
| `AdminApi.tsx` | `AdminApiNew.tsx` | ✅ Migrer vers New | Cost Projection + SLO + Anomaly Detection |
| `AdminBarOwners.tsx` | `AdminBarOwnersNew.tsx` | ✅ Migrer vers New | Kanban Board + Funnel Chart |
| `AdminCRM.tsx` | `AdminCRMNew.tsx` | ✅ Migrer vers New | React Hook Form + Zod + ResizablePanel |
| `AdminPushNotifications.tsx` | `AdminPushNotificationsNew.tsx` | ⚠️ À analyser | Non encore lu |

### ❌ Fichier Déjà Supprimé

- ✅ `AdminDashboardOld.tsx` → Supprimé avec succès

---

## 📝 ÉTAPES DE MIGRATION

### 1️⃣ AdminActivity → AdminActivityNew

**Différences clés:**
- ✅ Date Picker (Popover Calendar)
- ✅ PieChart pour distribution des événements
- ✅ UI plus "dashboard" avec couleurs

**Actions:**
1. Vérifier que `AdminActivityNew.tsx` fonctionne correctement
2. Mettre à jour la route dans `App.tsx`
3. Renommer `AdminActivityNew.tsx` → `AdminActivity.tsx`
4. Supprimer l'ancien fichier

**Code de migration App.tsx:**
```typescript
// AVANT
<Route path="/admin/activity" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminLayout>
        <AdminActivity />
      </AdminLayout>
    </AdminRoute>
  </ProtectedRoute>
} />

// APRÈS (AdminActivityNew utilise déjà AdminLayout)
<Route path="/admin/activity" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminActivityNew />
    </AdminRoute>
  </ProtectedRoute>
} />
```

---

### 2️⃣ AdminApi → AdminApiNew

**Différences clés:**
- ✅ Cost Projection Chart (ML simple avec trendline)
- ✅ Latency Distribution
- ✅ SLO Widget (Service Level Objectives)
- ✅ Anomaly Detector
- ✅ Onglets pour organiser les données

**Actions:**
1. Vérifier que tous les composants sont disponibles:
   - `CostProjectionChart`
   - `LatencyDistribution`
   - `CostTrends`
   - `SLOWidget`
   - `AnomalyDetector`
2. Mettre à jour la route dans `App.tsx`
3. Renommer `AdminApiNew.tsx` → `AdminApi.tsx`
4. Supprimer l'ancien fichier

---

### 3️⃣ AdminBarOwners → AdminBarOwnersNew

**Différences clés:**
- ✅ Kanban Board (drag & drop)
- ✅ Funnel Chart (conversion pipeline)
- ✅ Toggle Kanban/Liste
- ✅ UI SOTA 2025

**Actions:**
1. Vérifier que `KanbanBoard` et `FunnelChart` fonctionnent
2. Implémenter la vue "Liste" manquante dans AdminBarOwnersNew
3. Mettre à jour la route dans `App.tsx`
4. Renommer `AdminBarOwnersNew.tsx` → `AdminBarOwners.tsx`
5. Supprimer l'ancien fichier

**Note:** La vue "Liste" affiche actuellement "Vue liste disponible prochainement". Il faut l'implémenter avant migration.

---

### 4️⃣ AdminCRM → AdminCRMNew

**Différences clés:**
- ✅ React Hook Form + Zod (validation type-safe)
- ✅ ResizablePanel (UI moderne)
- ✅ Schéma de validation `campaignSchema`
- ✅ Meilleure séparation des préoccupations

**Actions:**
1. Vérifier que `campaignSchema` existe dans `src/schemas/campaignSchema.ts`
2. Tester la validation de formulaire
3. Mettre à jour la route dans `App.tsx`
4. Renommer `AdminCRMNew.tsx` → `AdminCRM.tsx`
5. Supprimer l'ancien fichier

**Dépendances à vérifier:**
```typescript
// src/schemas/campaignSchema.ts
import { z } from 'zod';

export const campaignSchema = z.object({
  campaign_name: z.string().min(3, "Minimum 3 caractères"),
  subject: z.string().min(5, "Minimum 5 caractères"),
  content: z.string().min(10, "Minimum 10 caractères"),
  send_at: z.string().nullable(),
  segment_id: z.string().nullable(),
  lifecycle_stage_id: z.string().nullable(),
  template_id: z.string().nullable(),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;
```

---

### 5️⃣ AdminPushNotifications → AdminPushNotificationsNew

**État:** Non encore analysé

**Actions:**
1. Lire les deux fichiers
2. Comparer les fonctionnalités
3. Décider de la migration
4. Appliquer si pertinent

---

## 🔧 COMPOSANTS À VÉRIFIER

### Composants utilisés par AdminApiNew
- [ ] `CostProjectionChart` (`src/components/admin/charts/CostProjectionChart.tsx`)
- [ ] `LatencyDistribution` (`src/components/admin/analytics/LatencyDistribution.tsx`)
- [ ] `CostTrends` (`src/components/admin/analytics/CostTrends.tsx`)
- [ ] `SLOWidget` (`src/components/admin/analytics/SLOWidget.tsx`)
- [ ] `AnomalyDetector` (`src/components/admin/analytics/AnomalyDetector.tsx`)

### Composants utilisés par AdminBarOwnersNew
- [ ] `KanbanBoard` (`src/components/admin/KanbanBoard.tsx`)
- [ ] `FunnelChart` (`src/components/admin/charts/FunnelChart.tsx`)

### Schémas utilisés par AdminCRMNew
- [ ] `campaignSchema` (`src/schemas/campaignSchema.ts`)

---

## 📋 CHECKLIST DE MIGRATION

### Phase 1: Préparation (30 min)
- [x] ✅ Créer rapport d'audit
- [x] ✅ Supprimer AdminDashboardOld.tsx
- [ ] Vérifier l'existence de tous les composants requis
- [ ] Créer des backups des fichiers à modifier

### Phase 2: Migration AdminActivity (15 min)
- [ ] Tester AdminActivityNew en local
- [ ] Mettre à jour App.tsx
- [ ] Renommer AdminActivityNew → AdminActivity
- [ ] Supprimer l'ancien fichier
- [ ] Tester la route `/admin/activity`

### Phase 3: Migration AdminApi (20 min)
- [ ] Vérifier composants analytics
- [ ] Tester AdminApiNew en local
- [ ] Mettre à jour App.tsx
- [ ] Renommer AdminApiNew → AdminApi
- [ ] Supprimer l'ancien fichier
- [ ] Tester la route `/admin/api`

### Phase 4: Migration AdminBarOwners (30 min)
- [ ] Implémenter vue "Liste" dans AdminBarOwnersNew
- [ ] Tester Kanban + Liste
- [ ] Mettre à jour App.tsx
- [ ] Renommer AdminBarOwnersNew → AdminBarOwners
- [ ] Supprimer l'ancien fichier
- [ ] Tester la route `/admin/bar-owners`

### Phase 5: Migration AdminCRM (30 min)
- [ ] Créer `campaignSchema.ts` si manquant
- [ ] Tester validation de formulaire
- [ ] Mettre à jour App.tsx
- [ ] Renommer AdminCRMNew → AdminCRM
- [ ] Supprimer l'ancien fichier
- [ ] Tester la route `/admin/crm`

### Phase 6: Migration AdminPushNotifications (15 min)
- [ ] Analyser les deux fichiers
- [ ] Décider de la migration
- [ ] Appliquer si pertinent

### Phase 7: Tests Finaux (30 min)
- [ ] Tester toutes les routes admin
- [ ] Vérifier qu'aucune erreur console
- [ ] Tester les fonctionnalités critiques
- [ ] Valider avec l'utilisateur

---

## ⏱️ TEMPS ESTIMÉ TOTAL

- **Préparation:** 30 min
- **Migrations:** 2h (5 fichiers × 15-30 min)
- **Tests:** 30 min
- **TOTAL:** ~3 heures

---

## 🚨 RISQUES ET MITIGATIONS

### Risque 1: Composants manquants
**Impact:** Migration bloquée  
**Mitigation:** Vérifier l'existence de tous les composants avant migration  
**Fallback:** Créer les composants manquants ou garder l'ancienne version

### Risque 2: Routes cassées
**Impact:** Pages admin inaccessibles  
**Mitigation:** Tester chaque route après migration  
**Fallback:** Rollback via Git

### Risque 3: Perte de fonctionnalités
**Impact:** Régression fonctionnelle  
**Mitigation:** Comparer les fonctionnalités avant/après  
**Fallback:** Réintégrer les fonctionnalités manquantes

---

## 📊 MÉTRIQUES DE SUCCÈS

- ✅ 0 fichiers `*Old.tsx` restants
- ✅ 0 fichiers `*New.tsx` non routés
- ✅ Toutes les routes admin fonctionnelles
- ✅ Aucune erreur console
- ✅ UI cohérente sur toutes les pages

---

**Document créé le:** 19 novembre 2025  
**Prochaine mise à jour:** Après chaque migration


