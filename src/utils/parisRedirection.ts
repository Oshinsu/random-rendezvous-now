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

// Coordonnées de Paris Centre (Place du Châtelet)
export const PARIS_CENTRE_COORDINATES = {
  latitude: 48.8566,
  longitude: 2.3522,
  locationName: 'Paris Centre'
} as const;

/**
 * Retourne la location pour créer/rechercher un groupe
 * - Si utilisateur IDF : Paris Centre (force la compatibilité)
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
    console.log('🗺️ [PARIS REDIRECTION] Utilisateur IDF détecté → Redirection vers Paris Centre');
    console.log('🗺️ [PARIS REDIRECTION] Redirection:', userLocation.locationName, '→ Paris Centre');
    return PARIS_CENTRE_COORDINATES;
  }
  
  console.log('📍 [PARIS REDIRECTION] Utilisateur hors IDF → Location originale conservée (avec sanitisation)');
  
  // Sanitiser les coordonnées pour garantir max 6 décimales
  const validationResult = CoordinateValidator.validateCoordinates(
    userLocation.latitude, 
    userLocation.longitude
  );
  
  if (!validationResult.isValid || !validationResult.sanitized) {
    console.error('🚨 [PARIS REDIRECTION] Coordonnées invalides:', validationResult.error);
    // Fallback vers Paris Centre si coordonnées invalides
    return PARIS_CENTRE_COORDINATES;
  }
  
  const sanitizedLocation: LocationData = {
    latitude: validationResult.sanitized.latitude,
    longitude: validationResult.sanitized.longitude,
    locationName: userLocation.locationName
  };
  
  console.log('✅ [PARIS REDIRECTION] Coordonnées sanitisées:', sanitizedLocation.latitude, sanitizedLocation.longitude);
  return sanitizedLocation;
}