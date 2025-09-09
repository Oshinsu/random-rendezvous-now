import { LocationData } from '@/services/geolocation';
import { detectIleDeFrance } from './idfDetection';

/**
 * Utilitaire pour rediriger les utilisateurs IDF vers Paris Centre
 * 
 * Garantit que TOUS les utilisateurs d'Île-de-France créent/rejoignent
 * des groupes à Paris Centre, assurant la compatibilité maximale.
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
  console.log('🎯 [PARIS REDIRECTION] Analyse de la location utilisateur...');
  
  const isIdfUser = detectIleDeFrance(userLocation.locationName);
  
  if (isIdfUser) {
    console.log('🗺️ [PARIS REDIRECTION] Utilisateur IDF → Redirection vers Paris Centre');
    return PARIS_CENTRE_COORDINATES;
  }
  
  console.log('📍 [PARIS REDIRECTION] Utilisateur hors IDF → Location originale conservée');
  return userLocation;
}