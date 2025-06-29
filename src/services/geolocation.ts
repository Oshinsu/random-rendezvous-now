
import { CoordinateValidator } from '@/utils/coordinateValidation';
import { RateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';

export interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

export class GeolocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    // Apply rate limiting
    if (RateLimiter.isRateLimited('geolocation', RATE_LIMITS.GEOLOCATION)) {
      throw new Error('Trop de demandes de géolocalisation. Veuillez attendre avant de réessayer.');
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Validate and sanitize coordinates
          const validation = CoordinateValidator.validateCoordinates(latitude, longitude);
          if (!validation.isValid) {
            console.error('🚨 Invalid coordinates from geolocation API:', validation.error);
            reject(new Error('Coordonnées de géolocalisation invalides'));
            return;
          }

          const sanitizedCoords = validation.sanitized!;
          
          try {
            // Géocodage inversé pour obtenir le nom de la localisation
            const locationName = await this.reverseGeocode(sanitizedCoords.latitude, sanitizedCoords.longitude);
            resolve({ 
              latitude: sanitizedCoords.latitude, 
              longitude: sanitizedCoords.longitude, 
              locationName 
            });
          } catch (error) {
            // Si le géocodage échoue, on utilise quand même les coordonnées
            resolve({ 
              latitude: sanitizedCoords.latitude, 
              longitude: sanitizedCoords.longitude, 
              locationName: `${sanitizedCoords.latitude.toFixed(4)}, ${sanitizedCoords.longitude.toFixed(4)}` 
            });
          }
        },
        (error) => {
          let errorMessage = 'Erreur de géolocalisation';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout de géolocalisation';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
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
