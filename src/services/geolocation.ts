
import { logger } from '@/utils/logger';

export interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

export class GeolocationService {
  private static locationCache: { location: LocationData; timestamp: number } | null = null;
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static lastLocationMetadata: any = null;

  /**
   * Force cache invalidation - useful for debugging coordinate issues
   */
  static clearCache(): void {
    logger.debug('Cache géolocalisation vidé forcément');
    this.locationCache = null;
    this.lastLocationMetadata = null;
  }

  /**
   * Détecte proactivement l'état des permissions de géolocalisation
   */
  static async checkPermissionState(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      logger.debug('État permission géolocalisation:', result.state);
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch {
      logger.warn('Permissions API non supportée, fallback sur getCurrentPosition direct');
      return 'prompt';
    }
  }

  /**
   * Tentative de géolocalisation avec paramètres configurables
   */
  private static attemptGeolocation(highAccuracy: boolean, timeout: number): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      logger.debug(`Tentative géolocalisation (highAccuracy: ${highAccuracy}, timeout: ${timeout}ms)`);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          logger.debug('Position obtenue', {
            latitude,
            longitude,
            source: highAccuracy ? 'GPS' : 'WiFi/Cell',
          });
          resolve({ latitude, longitude });
        },
        (error) => {
          logger.error(`Erreur géolocalisation (${highAccuracy ? 'haute' : 'basse'} précision): ${error.message}`);
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: timeout,
          maximumAge: highAccuracy ? 0 : 60000,
        }
      );
    });
  }

  /**
   * Fallback IP-based geolocation (dernier recours)
   * Utilise ipapi.co (gratuit, 1000 req/jour, pas besoin d'API key)
   */
  private static async getIPBasedLocation(): Promise<{ latitude: number; longitude: number }> {
    logger.debug('Tentative géolocalisation IP...');

    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('IP Geolocation API failed');
      }

      const data = await response.json();

      if (!data.latitude || !data.longitude) {
        throw new Error('Invalid IP geolocation response');
      }

      logger.debug('Position IP détectée', {
        city: data.city,
        country: data.country_name,
        accuracy: '~5-50km (IP-based)'
      });

      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude)
      };
    } catch (error) {
      logger.error('Erreur IP Geolocation', error);
      throw error;
    }
  }

  static async getCurrentLocation(): Promise<LocationData> {
    // Vérifier le cache d'abord
    if (this.locationCache) {
      const now = Date.now();
      const age = now - this.locationCache.timestamp;
      if (age < this.CACHE_DURATION) {
        const { CoordinateValidator } = await import('@/utils/coordinateValidation');
        const validation = CoordinateValidator.validateCoordinates(
          this.locationCache.location.latitude,
          this.locationCache.location.longitude
        );

        if (validation.isValid && validation.sanitized) {
          if (validation.sanitized.latitude !== this.locationCache.location.latitude ||
              validation.sanitized.longitude !== this.locationCache.location.longitude) {
            this.locationCache.location = {
              ...this.locationCache.location,
              latitude: validation.sanitized.latitude,
              longitude: validation.sanitized.longitude
            };
          }
          logger.debug('Position récupérée du cache', this.locationCache.location.locationName);
          return this.locationCache.location;
        } else {
          logger.warn('Cache géolocalisation invalide, suppression et nouvelle géolocalisation');
          this.locationCache = null;
        }
      }
    }

    return this.performGeolocation();
  }

  private static async performGeolocation(): Promise<LocationData> {
    if (!navigator.geolocation) {
      throw new Error('GEOLOCATION_NOT_SUPPORTED: Géolocalisation non supportée par ce navigateur');
    }

    const permissionState = await this.checkPermissionState();

    if (permissionState === 'denied') {
      throw new Error('GEOLOCATION_DENIED: Géolocalisation refusée par l\'utilisateur. Réactive-la dans les paramètres de ton navigateur.');
    }

    let coords: { latitude: number; longitude: number };
    try {
      coords = await this.attemptGeolocation(true, 8000);
    } catch {
      logger.warn('Tentative haute précision échouée, fallback basse précision');

      try {
        coords = await this.attemptGeolocation(false, 5000);
      } catch {
        logger.warn('Géolocalisation navigateur échouée, tentative IP Geolocation');

        try {
          const ipPromise = this.getIPBasedLocation();
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('IP Geolocation timeout')), 3000)
          );
          coords = await Promise.race([ipPromise, timeoutPromise]) as { latitude: number; longitude: number };
        } catch {
          throw new Error('GEOLOCATION_FAILED: Impossible de déterminer votre position. Active le GPS de ton appareil ou vérifie ta connexion.');
        }
      }
    }

    const { latitude, longitude } = coords;

    const { CoordinateValidator } = await import('@/utils/coordinateValidation');
    const validation = CoordinateValidator.validateCoordinates(latitude, longitude);

    if (!validation.isValid || !validation.sanitized) {
      logger.error('Coordonnées invalides reçues du navigateur');
      throw new Error('Coordonnées invalides');
    }

    const sanitizedLatitude = validation.sanitized.latitude;
    const sanitizedLongitude = validation.sanitized.longitude;

    try {
      const locationName = await this.reverseGeocode(sanitizedLatitude, sanitizedLongitude);
      const location: LocationData = {
        latitude: sanitizedLatitude,
        longitude: sanitizedLongitude,
        locationName
      };
      this.locationCache = { location, timestamp: Date.now() };
      return location;
    } catch {
      logger.warn('Géocodage échoué, utilisation des coordonnées sanitisées');
      const location: LocationData = {
        latitude: sanitizedLatitude,
        longitude: sanitizedLongitude,
        locationName: `${sanitizedLatitude.toFixed(4)}, ${sanitizedLongitude.toFixed(4)}`
      };
      this.locationCache = { location, timestamp: Date.now() };
      return location;
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
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
        const {
          city,
          town,
          village,
          suburb,
          neighbourhood,
          municipality,
          postcode,
          county,
          state
        } = data.address;

        this.lastLocationMetadata = {
          department: postcode?.substring(0, 2),
          region: state,
          postalCode: postcode
        };

        const cityName = city || town || village || suburb || neighbourhood || municipality;

        if (postcode && cityName) {
          return `${cityName} ${postcode}`;
        }

        if (postcode) {
          return `Localisation ${postcode}`;
        }

        if (cityName) {
          return cityName;
        }

        if (county || state) {
          return county || state;
        }
      }

      return 'Localisation inconnue';
    } catch (error) {
      logger.error('Erreur reverse geocoding', error);
      throw error;
    }
  }

  /**
   * Get the last extracted location metadata
   */
  static getLastLocationMetadata() {
    return this.lastLocationMetadata;
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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
