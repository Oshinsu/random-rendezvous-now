/**
 * Utilitaire centralisé pour la détection des utilisateurs en Île-de-France
 * 
 * Remplace les 3 implémentations disparates dans les services :
 * - GroupGeolocationService.isUserInIleDeFrance()
 * - UnifiedGroupService.isUserInIleDeFrance() 
 * - GeolocationService.detectIleDeFrance()
 */

export function detectIleDeFrance(locationName: string, address?: string): boolean {
  const location = locationName.toLowerCase();
  const fullAddress = address?.toLowerCase() || '';
  
  console.log('🗺️ [IDF DETECTION] Vérification IDF pour:', locationName);
  
  // Codes postaux IDF uniquement (75, 77, 78, 91, 92, 93, 94, 95)
  // Support multiple formats: "Paris 75001", "Paris (75001)", "75001", "Localisation 75001"
  const idfPostalCodes = /\b(75\d{3}|77\d{3}|78\d{3}|91\d{3}|92\d{3}|93\d{3}|94\d{3}|95\d{3})\b/;
  
  // Vérification par code postal dans le nom de lieu ou l'adresse
  if (idfPostalCodes.test(location) || idfPostalCodes.test(fullAddress)) {
    console.log('✅ [IDF DETECTION] Utilisateur IDF détecté par code postal');
    return true;
  }
  
  console.log('❌ [IDF DETECTION] Utilisateur hors IDF');
  return false;
}