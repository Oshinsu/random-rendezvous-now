# Guide d'Optimisation des Images - SOTA 2025

## 🎯 Objectif
Optimiser toutes les images du site pour obtenir des performances maximales (< 200KB par image) tout en conservant une qualité visuelle excellente.

## 📊 État Actuel des Images

### Images actuelles à optimiser :
```
src/assets/
├── hero-banner-optimized.jpg (✅ déjà optimisé)
├── hero-banner.png (❌ à remplacer/supprimer)
├── new-hero-banner.jpg (❌ à analyser)
├── new-benefit-1.jpg (❌ à optimiser)
├── new-benefit-2.jpg (❌ à optimiser)
├── new-benefit-3.jpg (❌ à optimiser)
├── new-benefit-4.jpg (❌ à optimiser)
├── step-1.png (❌ à optimiser)
├── step-2.png (❌ à optimiser)
└── step-3.png (❌ à optimiser)
```

## 🚀 Phase 6 : Optimisation des Images (90 min)

### Étape 1 : Analyse des Images (10 min)

**Action :** Mesurer le poids actuel de chaque image

```bash
# Linux/Mac
ls -lh src/assets/*.{jpg,png}

# Windows PowerShell
Get-ChildItem src/assets/*.jpg,*.png | Select-Object Name, Length
```

**Objectifs de taille :**
- **Hero images** : < 300KB (grande dimension)
- **Benefits images** : < 150KB (taille moyenne)
- **Step icons/images** : < 80KB (petites dimensions)

---

### Étape 2 : Conversion et Compression (40 min)

#### Option A : Utiliser TinyPNG (Recommandé - Facile)

1. Aller sur https://tinypng.com
2. Uploader les images une par une (ou en batch)
3. Télécharger les versions optimisées
4. **Renommer** avec `-optimized` : `new-benefit-1-optimized.jpg`

#### Option B : Utiliser ImageOptim (Mac)

1. Installer ImageOptim : https://imageoptim.com/
2. Glisser-déposer toutes les images du dossier `src/assets`
3. L'outil va compresser automatiquement (sans perte de qualité visible)

#### Option C : Ligne de commande avec Sharp (Développeurs)

```bash
# Installer Sharp
npm install -g sharp-cli

# Optimiser une image JPG
sharp input.jpg -o output.jpg --quality 80 --resize 1920

# Convertir PNG en WebP (meilleure compression)
sharp input.png -o output.webp --quality 85
```

#### Option D : Utiliser Squoosh (Web App Google)

1. Aller sur https://squoosh.app/
2. Uploader l'image
3. Choisir le format **WebP** ou **MozJPEG**
4. Ajuster la qualité à **80-85%**
5. Télécharger le fichier optimisé

---

### Étape 3 : Migration vers Supabase Storage (40 min)

**Pourquoi Supabase Storage ?**
- ✅ URLs persistantes et CDN
- ✅ Gestion centralisée
- ✅ Pas de rebuild nécessaire pour changer une image
- ✅ Transformations d'images automatiques (resize, format)

#### 3.1 Créer le bucket dans Supabase

1. Aller sur https://supabase.com/dashboard/project/xhrievvdnajvylyrowwu/storage/buckets
2. Cliquer sur **"New bucket"**
3. Nom : `site-images`
4. **Public** : ✅ Activé (pour que les images soient accessibles)
5. Cliquer sur **"Create bucket"**

#### 3.2 Uploader les images optimisées

1. Aller dans le bucket `site-images`
2. Créer des dossiers :
   - `hero/`
   - `benefits/`
   - `steps/`
3. Uploader les images optimisées dans les bons dossiers

#### 3.3 Copier les URLs publiques

Format d'URL :
```
https://xhrievvdnajvylyrowwu.supabase.co/storage/v1/object/public/site-images/hero/hero-banner-optimized.jpg
```

#### 3.4 Mettre à jour le CMS

**Dans l'admin (`/admin/content/hero`) :**

1. Aller sur la clé `hero_background_image_url`
2. Cliquer sur **"Edit"**
3. Dans l'onglet **"URL"**, coller la nouvelle URL Supabase
4. Cliquer sur **"Save"**

**Répéter pour toutes les images CMS :**
- `benefit_1_image` → nouvelle URL
- `benefit_2_image` → nouvelle URL
- `benefit_3_image` → nouvelle URL
- `benefit_4_image` → nouvelle URL

---

### Étape 4 : Nettoyage (Optionnel)

Une fois que toutes les images sont migrées vers Supabase Storage :

```bash
# Supprimer les anciennes images non optimisées
rm src/assets/hero-banner.png
rm src/assets/new-hero-banner.jpg
rm src/assets/new-benefit-*.jpg
rm src/assets/step-*.png
```

**⚠️ IMPORTANT** : Ne supprimez `hero-banner-optimized.jpg` que si vous êtes sûr que l'URL Supabase fonctionne !

---

## 🎨 Bonnes Pratiques SOTA 2025

### 1. Formats d'images recommandés

| Type d'image | Format préféré | Qualité | Poids cible |
|-------------|----------------|---------|-------------|
| **Photos/Héros** | WebP ou AVIF | 80-85% | < 300KB |
| **Illustrations** | WebP ou PNG | 85-90% | < 150KB |
| **Icônes simples** | SVG (vectoriel) | - | < 10KB |
| **Thumbnails** | WebP | 75-80% | < 50KB |

### 2. Dimensions recommandées

- **Hero banner** : 1920x1080px (16:9)
- **Benefits images** : 800x600px (4:3)
- **Step icons** : 400x400px (1:1)

### 3. Lazy Loading (Déjà implémenté)

Le composant `OptimizedImage.tsx` gère automatiquement :
- ✅ Chargement différé (lazy loading)
- ✅ Placeholders pendant le chargement
- ✅ Gestion des erreurs

---

## 📈 Résultats Attendus

**Avant optimisation :**
- Hero PNG : ~2-5MB
- Total assets : ~8-12MB

**Après optimisation :**
- Hero WebP : ~200KB (-95%)
- Total assets : ~1-2MB (-85%)

**Impact sur les performances :**
- ⚡ LCP (Largest Contentful Paint) : -2s
- ⚡ Score Lighthouse : +15-20 points
- ⚡ Temps de chargement mobile : -50%

---

## 🔗 Ressources Utiles

- **TinyPNG** : https://tinypng.com
- **Squoosh** : https://squoosh.app
- **ImageOptim** : https://imageoptim.com
- **Sharp CLI** : https://sharp.pixelplumbing.com/api-utility
- **Supabase Storage** : https://supabase.com/docs/guides/storage

---

## ✅ Checklist de Validation

- [ ] Toutes les images pèsent < 200KB
- [ ] Les images sont uploadées sur Supabase Storage
- [ ] Les URLs CMS sont mises à jour
- [ ] Les anciennes images locales sont supprimées
- [ ] Le site charge en < 2s sur 4G
- [ ] Score Lighthouse > 90 (Performance)

---

## 🚨 Note Importante

**Ne supprimez PAS les images locales avant d'avoir :**
1. ✅ Uploadé les versions optimisées sur Supabase
2. ✅ Mis à jour les URLs dans le CMS
3. ✅ Vérifié que les images s'affichent correctement sur le site

---

**Temps estimé total : 90 minutes**

Besoin d'aide ? Consultez la documentation Supabase Storage ou demandez à l'équipe !
