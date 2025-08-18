
import { CoordinateValidator } from '@/utils/coordinateValidation';
import { RateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';

export interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

export class GeolocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    console.log('🔍 [GEOLOC] Démarrage géolocalisation...');
    
    // Check rate limiting with detailed logging
    const rateLimitStatus = RateLimiter.getStatus('geolocation');
    console.log('🔍 [GEOLOC] Rate limit status:', rateLimitStatus);
    
    if (RateLimiter.isRateLimited('geolocation', RATE_LIMITS.GEOLOCATION)) {
      console.warn('🚫 [GEOLOC] Rate limited! Status:', rateLimitStatus);
      const remainingTime = Math.ceil(rateLimitStatus.remainingTime / 1000);
      throw new Error(`Rate limit atteint. Veuillez attendre ${remainingTime} secondes avant de réessayer.`);
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error('🚨 [GEOLOC] Navigateur non supporté');
        reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur'));
        return;
      }

      console.log('📍 [GEOLOC] Demande de position (timeout 15s)...');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            console.log('✅ [GEOLOC] Position obtenue:', position.coords);
            await this.processLocationSuccess(position, resolve, reject);
          } catch (error) {
            console.error('🚨 [GEOLOC] Erreur traitement position:', error);
            reject(error);
          }
        },
        (error) => {
          console.error('🚨 [GEOLOC] Échec géolocalisation:', error.message, 'Code:', error.code);
          let errorMessage = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission de géolocalisation refusée. Veuillez autoriser la géolocalisation dans votre navigateur.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible. Vérifiez votre connexion et réessayez.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout de géolocalisation. Veuillez réessayer.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // 15 secondes
          maximumAge: 60000 // 1 minute
        }
      );
    });
  }

  private static async processLocationSuccess(
    position: GeolocationPosition, 
    resolve: (value: LocationData) => void,
    reject: (reason?: any) => void
  ): Promise<void> {
    const { latitude, longitude } = position.coords;
    
    // Validate and sanitize coordinates
    const validation = CoordinateValidator.validateCoordinates(latitude, longitude);
    if (!validation.isValid) {
      console.error('🚨 [GEOLOC] Coordonnées invalides:', validation.error);
      reject(new Error('Coordonnées de géolocalisation invalides'));
      return;
    }

    const sanitizedCoords = validation.sanitized!;
    console.log('✅ [GEOLOC] Coordonnées validées:', sanitizedCoords);
    
    try {
      // Géocodage inversé pour obtenir le nom de la localisation
      console.log('🔍 [GEOLOC] Démarrage géocodage inversé...');
      const locationName = await this.reverseGeocode(sanitizedCoords.latitude, sanitizedCoords.longitude);
      console.log('✅ [GEOLOC] Géocodage réussi:', locationName);
      
      resolve({ 
        latitude: sanitizedCoords.latitude, 
        longitude: sanitizedCoords.longitude, 
        locationName 
      });
    } catch (error) {
      console.warn('⚠️ [GEOLOC] Géocodage échoué, utilisation coordonnées brutes:', error);
      // Si le géocodage échoue, on utilise quand même les coordonnées
      resolve({ 
        latitude: sanitizedCoords.latitude, 
        longitude: sanitizedCoords.longitude, 
        locationName: `${sanitizedCoords.latitude.toFixed(4)}, ${sanitizedCoords.longitude.toFixed(4)}` 
      });
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    // Validate coordinates before making API call
    const validation = CoordinateValidator.validateCoordinates(lat, lng);
    if (!validation.isValid) {
      throw new Error(`Invalid coordinates for geocoding: ${validation.error}`);
    }

    const sanitizedCoords = validation.sanitized!;
    
    try {
      // Utilise l'API de géocodage inversé de Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${sanitizedCoords.latitude}&lon=${sanitizedCoords.longitude}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Random-App/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur de géocodage');
      }
      
      const data = await response.json();
      
      if (data.address) {
        const { city, town, village, suburb, neighbourhood } = data.address;
        return city || town || village || suburb || neighbourhood || 'Localisation inconnue';
      }
      
      return 'Localisation inconnue';
    } catch (error) {
      console.error('Erreur de géocodage inversé:', error);
      throw error;
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Validate all coordinates
    const validation1 = CoordinateValidator.validateCoordinates(lat1, lon1);
    const validation2 = CoordinateValidator.validateCoordinates(lat2, lon2);
    
    if (!validation1.isValid || !validation2.isValid) {
      throw new Error('Invalid coordinates for distance calculation');
    }

    const coords1 = validation1.sanitized!;
    const coords2 = validation2.sanitized!;

    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRadians(coords2.latitude - coords1.latitude);
    const dLon = this.toRadians(coords2.longitude - coords1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coords1.latitude)) * Math.cos(this.toRadians(coords2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance en mètres
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  }
}
