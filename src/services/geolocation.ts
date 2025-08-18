import { CoordinateValidator } from '@/utils/coordinateValidation';

export interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

const LOCATION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - cache robuste

export class GeolocationService {
  private static cachedLocation: LocationData | null = null;
  private static lastCacheTime = 0;

  static async getCurrentLocation(forceRefresh = false): Promise<LocationData> {
    console.log('🔍 [GEOLOC] Démarrage géolocalisation...');
    
    // Vérifier le cache (30 minutes)
    const now = Date.now();
    if (!forceRefresh && this.cachedLocation && (now - this.lastCacheTime) < LOCATION_CACHE_DURATION) {
      console.log('📍 [GEOLOC] Utilisation du cache:', this.cachedLocation.locationName);
      return this.cachedLocation;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error('🚨 [GEOLOC] Navigateur non supporté');
        reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur'));
        return;
      }

      console.log('📍 [GEOLOC] Demande de position (timeout 30s)...');
      
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
          enableHighAccuracy: false,
          timeout: 30000, 
          maximumAge: LOCATION_CACHE_DURATION
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
      const locationName = await this.reverseGeocode(sanitizedCoords.latitude, sanitizedCoords.longitude);
      const locationData: LocationData = {
        latitude: sanitizedCoords.latitude,
        longitude: sanitizedCoords.longitude,
        locationName
      };
      
      // Mettre en cache
      this.cachedLocation = locationData;
      this.lastCacheTime = Date.now();
      
      console.log('✅ [GEOLOC] Position obtenue avec succès:', locationData);
      resolve(locationData);
    } catch (error) {
      console.warn('⚠️ [GEOLOC] Géocodage échoué, utilisation coordonnées brutes:', error);
      // Si le géocodage échoue, on utilise quand même les coordonnées
      const locationData: LocationData = {
        latitude: sanitizedCoords.latitude, 
        longitude: sanitizedCoords.longitude, 
        locationName: `${sanitizedCoords.latitude.toFixed(4)}, ${sanitizedCoords.longitude.toFixed(4)}` 
      };
      
      // Mettre en cache même avec géocodage échoué
      this.cachedLocation = locationData;
      this.lastCacheTime = Date.now();
      
      resolve(locationData);
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