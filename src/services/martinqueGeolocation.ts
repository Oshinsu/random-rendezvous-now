
/**
 * Martinique Geolocation Service
 * Service de géolocalisation spécialisé pour la Martinique
 */

export interface MartiniqueLocation {
  latitude: number;
  longitude: number;
  locationName: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Service de géolocalisation pour la Martinique
 */
export class MartiniqueGeolocationService {
  // Coordonnées de Fort-de-France (centre de la Martinique)
  private static readonly FORT_DE_FRANCE = {
    latitude: 14.6037,
    longitude: -61.0731,
    locationName: 'Fort-de-France, Martinique'
  };

  // Limites géographiques de la Martinique
  private static readonly MARTINIQUE_BOUNDS = {
    north: 14.8787,
    south: 14.3887,
    east: -60.8094,  
    west: -61.2294
  };

  // Principales villes de Martinique avec leurs coordonnées
  private static readonly MARTINIQUE_CITIES = [
    { name: 'Fort-de-France', latitude: 14.6037, longitude: -61.0731 },
    { name: 'Le Lamentin', latitude: 14.5969, longitude: -60.9989 },
    { name: 'Schoelcher', latitude: 14.6125, longitude: -61.0969 },
    { name: 'Sainte-Marie', latitude: 14.7689, longitude: -61.0136 },
    { name: 'Le Robert', latitude: 14.6744, longitude: -60.9367 },
    { name: 'Trinité', latitude: 14.7356, longitude: -60.9689 },
    { name: 'Le François', latitude: 14.6178, longitude: -60.9067 },
    { name: 'Saint-Pierre', latitude: 14.7389, longitude: -61.1769 },
    { name: 'Le Marin', latitude: 14.4719, longitude: -60.8689 },
    { name: 'Sainte-Anne', latitude: 14.4444, longitude: -60.8833 }
  ];

  /**
   * Validation stricte des coordonnées Martinique
   */
  static isValidMartiniqueCoordinates(latitude: number, longitude: number): boolean {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
    if (isNaN(latitude) || isNaN(longitude)) return false;
    if (!isFinite(latitude) || !isFinite(longitude)) return false;

    const bounds = this.MARTINIQUE_BOUNDS;
    return (
      latitude >= bounds.south &&
      latitude <= bounds.north &&
      longitude >= bounds.west &&
      longitude <= bounds.east
    );
  }

  /**
   * Obtention de la position de référence pour la Martinique
   */
  static getDefaultMartiniqueLocation(): MartiniqueLocation {
    console.log('📍 [MARTINIQUE GEO] Utilisation position Fort-de-France par défaut');
    return {
      ...this.FORT_DE_FRANCE,
      confidence: 'high'
    };
  }

  /**
   * Validation et correction de la position utilisateur
   */
  static validateAndCorrectUserLocation(
    userLatitude?: number, 
    userLongitude?: number, 
    userLocationName?: string
  ): MartiniqueLocation {
    console.log('🔍 [MARTINIQUE GEO] Validation position utilisateur:', {
      latitude: userLatitude,
      longitude: userLongitude,
      locationName: userLocationName
    });

    // Vérifier si les coordonnées utilisateur sont valides et en Martinique
    if (userLatitude && userLongitude && 
        this.isValidMartiniqueCoordinates(userLatitude, userLongitude)) {
      console.log('✅ [MARTINIQUE GEO] Position utilisateur valide en Martinique');
      return {
        latitude: userLatitude,
        longitude: userLongitude,
        locationName: userLocationName || 'Position utilisateur, Martinique',
        confidence: 'high'
      };
    }

    // Essayer de déduire la ville depuis le nom de localisation
    if (userLocationName) {
      const cityMatch = this.MARTINIQUE_CITIES.find(city => 
        userLocationName.toLowerCase().includes(city.name.toLowerCase())
      );

      if (cityMatch) {
        console.log('✅ [MARTINIQUE GEO] Ville trouvée depuis le nom:', cityMatch.name);
        return {
          latitude: cityMatch.latitude,
          longitude: cityMatch.longitude,
          locationName: `${cityMatch.name}, Martinique`,
          confidence: 'medium'
        };
      }
    }

    // Fallback sur Fort-de-France
    console.log('⚠️ [MARTINIQUE GEO] Fallback sur Fort-de-France');
    return {
      ...this.FORT_DE_FRANCE,
      confidence: 'low'
    };
  }

  /**
   * Calcul de la distance entre deux points en Martinique
   */
  static calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Obtention du rayon de recherche optimal pour la Martinique
   */
  static getOptimalSearchRadius(confidence: 'high' | 'medium' | 'low'): number {
    switch (confidence) {
      case 'high': return 5000;   // 5km pour position précise
      case 'medium': return 10000; // 10km pour position approximative  
      case 'low': return 25000;    // 25km pour couvrir la majeure partie de l'île
      default: return 15000;
    }
  }

  /**
   * Vérification si un lieu est proche des zones urbaines principales
   */
  static isNearUrbanArea(latitude: number, longitude: number): boolean {
    const MAX_DISTANCE_TO_CITY = 15000; // 15km

    return this.MARTINIQUE_CITIES.some(city => {
      const distance = this.calculateDistance(
        latitude, longitude,
        city.latitude, city.longitude
      );
      return distance <= MAX_DISTANCE_TO_CITY;
    });
  }
}
