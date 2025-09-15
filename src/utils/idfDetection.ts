/**
 * Utilitaire centralisé pour la détection des utilisateurs en Île-de-France
 * 
 * Utilise une approche hybride :
 * 1. Détection par coordonnées géographiques (méthode principale)
 * 2. Détection par codes postaux (fallback)
 * 3. Détection par métadonnées administratives
 */

export interface LocationMetadata {
  department?: string;
  region?: string;
  postalCode?: string;
}

/**
 * Détection IDF par coordonnées géographiques (bounding box)
 * Couvre toute l'Île-de-France de manière mathématiquement précise
 */
export function detectIdfByCoordinates(latitude: number, longitude: number): boolean {
  // Bounding box Île-de-France
  const IDF_BOUNDS = {
    latMin: 48.1,
    latMax: 49.2,
    lngMin: 1.4,
    lngMax: 3.6
  };
  
  const isInIdf = latitude >= IDF_BOUNDS.latMin && 
                  latitude <= IDF_BOUNDS.latMax && 
                  longitude >= IDF_BOUNDS.lngMin && 
                  longitude <= IDF_BOUNDS.lngMax;
  
  console.log(`🗺️ [IDF DETECTION] Coordonnées (${latitude}, ${longitude}) → ${isInIdf ? 'IDF' : 'Hors IDF'}`);
  return isInIdf;
}

/**
 * Détection IDF par métadonnées administratives
 */
export function detectIdfByMetadata(metadata: LocationMetadata): boolean {
  if (!metadata) return false;
  
  const { department, region, postalCode } = metadata;
  
  // Vérification par région
  if (region?.toLowerCase().includes('île-de-france')) {
    console.log('✅ [IDF DETECTION] Détecté par région:', region);
    return true;
  }
  
  // Vérification par département IDF
  const idfDepartments = ['75', '77', '78', '91', '92', '93', '94', '95'];
  if (department && idfDepartments.includes(department)) {
    console.log('✅ [IDF DETECTION] Détecté par département:', department);
    return true;
  }
  
  // Vérification par code postal
  if (postalCode) {
    const idfPostalCodes = /^(75|77|78|91|92|93|94|95)\d{3}$/;
    if (idfPostalCodes.test(postalCode)) {
      console.log('✅ [IDF DETECTION] Détecté par code postal:', postalCode);
      return true;
    }
  }
  
  return false;
}

/**
 * Détection IDF principale - utilise toutes les méthodes disponibles
 * Ordre de priorité : coordonnées > métadonnées > codes postaux dans le nom
 */
export function detectIleDeFrance(
  locationName: string, 
  address?: string, 
  latitude?: number, 
  longitude?: number,
  metadata?: LocationMetadata
): boolean {
  console.log('🗺️ [IDF DETECTION] Analyse complète pour:', locationName);
  
  // 1. Méthode principale : détection par coordonnées
  if (latitude !== undefined && longitude !== undefined) {
    const coordResult = detectIdfByCoordinates(latitude, longitude);
    if (coordResult) {
      console.log('✅ [IDF DETECTION] Détecté par coordonnées');
      return true;
    }
  }
  
  // 2. Détection par métadonnées administratives
  if (metadata && detectIdfByMetadata(metadata)) {
    console.log('✅ [IDF DETECTION] Détecté par métadonnées');
    return true;
  }
  
  // 3. Fallback : détection par codes postaux dans le nom/adresse
  const location = locationName.toLowerCase();
  const fullAddress = address?.toLowerCase() || '';
  const idfPostalCodes = /\b(75\d{3}|77\d{3}|78\d{3}|91\d{3}|92\d{3}|93\d{3}|94\d{3}|95\d{3})\b/;
  
  if (idfPostalCodes.test(location) || idfPostalCodes.test(fullAddress)) {
    console.log('✅ [IDF DETECTION] Détecté par code postal dans le nom');
    return true;
  }
  
  console.log('❌ [IDF DETECTION] Utilisateur hors IDF');
  return false;
}