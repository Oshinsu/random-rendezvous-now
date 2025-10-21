import { LocationData } from '@/services/geolocation';
import { GeolocationService } from '@/services/geolocation';
import { detectIleDeFrance } from './idfDetection';
import { CoordinateValidator } from './coordinateValidation';

/**
 * Utilitaire pour rediriger les utilisateurs IDF vers Paris Centre
 * 
 * Utilise la détection IDF améliorée avec coordonnées et métadonnées
 * pour garantir une redirection précise de TOUS les utilisateurs IDF.
 */

// 6 zones stratégiques de Paris intra-muros pour diversifier les recherches
export const PARIS_STRATEGIC_ZONES = [
  { latitude: 48.8606, longitude: 2.3475, locationName: 'Paris - Châtelet' },
  { latitude: 48.8534, longitude: 2.3330, locationName: 'Paris - Saint-Germain' },
  { latitude: 48.8421, longitude: 2.3219, locationName: 'Paris - Montparnasse' },
  { latitude: 48.8676, longitude: 2.3635, locationName: 'Paris - République' },
  { latitude: 48.8532, longitude: 2.3697, locationName: 'Paris - Bastille' },
  { latitude: 48.8698, longitude: 2.3075, locationName: 'Paris - Champs-Élysées' }
] as const;

// Fallback vers Châtelet si besoin
export const PARIS_CENTRE_FALLBACK = PARIS_STRATEGIC_ZONES[0];

/**
 * Sélectionne une zone stratégique aléatoire parmi les 6 zones Paris intra-muros
 */
function selectRandomParisZone(): LocationData {
  const randomIndex = Math.floor(Math.random() * PARIS_STRATEGIC_ZONES.length);
  const selectedZone = PARIS_STRATEGIC_ZONES[randomIndex];
  
  console.log(`🎲 [DIVERSIFICATION] Zone Paris sélectionnée (${randomIndex + 1}/6):`, selectedZone.locationName);
  
  return selectedZone;
}

/**
 * Retourne la location pour créer/rechercher un groupe
 * - Si utilisateur IDF : Zone aléatoire parmi 6 zones Paris intra-muros
 * - Si utilisateur hors IDF : location originale
 */
export function getGroupLocation(userLocation: LocationData): LocationData {
  console.log('🎯 [PARIS REDIRECTION] Analyse complète de la location utilisateur...');
  console.log('🎯 [PARIS REDIRECTION] Location:', userLocation.locationName);
  console.log('🎯 [PARIS REDIRECTION] Coordonnées:', userLocation.latitude, userLocation.longitude);
  
  // Récupérer les métadonnées du dernier reverse geocoding
  const metadata = GeolocationService.getLastLocationMetadata();
  
  // Utiliser la détection IDF complète avec toutes les méthodes
  const isIdfUser = detectIleDeFrance(
    userLocation.locationName,
    undefined, // pas d'adresse séparée
    userLocation.latitude,
    userLocation.longitude,
    metadata
  );
  
  if (isIdfUser) {
    const selectedZone = selectRandomParisZone();
    console.log('🗺️ [PARIS REDIRECTION] Utilisateur IDF détecté → Redirection vers zone Paris');
    console.log('🗺️ [PARIS REDIRECTION] Redirection:', userLocation.locationName, '→', selectedZone.locationName);
    return selectedZone;
  }
  
  console.log('📍 [PARIS REDIRECTION] Utilisateur hors IDF → Location originale conservée (avec sanitisation)');
  
  // Sanitiser les coordonnées pour garantir max 6 décimales
  const validationResult = CoordinateValidator.validateCoordinates(
    userLocation.latitude, 
    userLocation.longitude
  );
  
  if (!validationResult.isValid || !validationResult.sanitized) {
    console.error('🚨 [PARIS REDIRECTION] Coordonnées invalides:', validationResult.error);
    // Fallback vers Paris Châtelet si coordonnées invalides
    return PARIS_CENTRE_FALLBACK;
  }
  
  const sanitizedLocation: LocationData = {
    latitude: validationResult.sanitized.latitude,
    longitude: validationResult.sanitized.longitude,
    locationName: userLocation.locationName
  };
  
  console.log('✅ [PARIS REDIRECTION] Coordonnées sanitisées:', sanitizedLocation.latitude, sanitizedLocation.longitude);
  return sanitizedLocation;
}