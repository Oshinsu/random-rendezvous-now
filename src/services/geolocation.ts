
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
    console.log('🗑️ Cache géolocalisation vidé forcément');
    this.locationCache = null;
    this.lastLocationMetadata = null;
  }

  /**
   * Détecte proactivement l'état des permissions de géolocalisation
   */
  static async checkPermissionState(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      console.log('🔐 État permission géolocalisation:', result.state);
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch (error) {
      console.warn('⚠️ Permissions API non supportée, fallback sur getCurrentPosition direct');
      return 'prompt';
    }
  }

  /**
   * Tentative de géolocalisation avec paramètres configurables
   */
  private static attemptGeolocation(highAccuracy: boolean, timeout: number): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      console.log(`📍 Tentative géolocalisation (highAccuracy: ${highAccuracy}, timeout: ${timeout}ms)`);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('✅ Position obtenue:', { 
            latitude, 
            longitude, 
            accuracy: `${Math.round(accuracy)}m`,
            source: highAccuracy ? 'GPS' : 'WiFi/Cell',
            timestamp: new Date(position.timestamp).toISOString()
          });
          resolve({ latitude, longitude });
        },
        (error) => {
          const errorDetails = {
            code: error.code,
            message: error.message,
            codeExplanation: 
              error.code === 1 ? 'Permission refusée' :
              error.code === 2 ? 'Position indisponible (GPS/WiFi désactivé)' :
              error.code === 3 ? 'Timeout expiré' :
              'Erreur inconnue'
          };
          console.error(`❌ Erreur géolocalisation (${highAccuracy ? 'haute' : 'basse'} précision):`, errorDetails);
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
    console.log('🌐 Tentative géolocalisation IP...');
    
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
      
      console.log('✅ Position IP détectée:', { 
        city: data.city, 
        country: data.country_name,
        latitude: data.latitude, 
        longitude: data.longitude,
        accuracy: '~5-50km (IP-based)'
      });
      
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude)
      };
    } catch (error) {
      console.error('❌ Erreur IP Geolocation:', error);
      throw error;
    }
  }

  static async getCurrentLocation(): Promise<LocationData> {
    // Vérifier le cache d'abord
    if (this.locationCache) {
      const now = Date.now();
      const age = now - this.locationCache.timestamp;
      if (age < this.CACHE_DURATION) {
        // CRITIQUE: Valider et sanitiser les coordonnées du cache
        const { CoordinateValidator } = await import('@/utils/coordinateValidation');
        const validation = CoordinateValidator.validateCoordinates(
          this.locationCache.location.latitude, 
          this.locationCache.location.longitude
        );
        
        if (validation.isValid && validation.sanitized) {
          // Mettre à jour le cache avec les coordonnées sanitisées si nécessaire
          if (validation.sanitized.latitude !== this.locationCache.location.latitude || 
              validation.sanitized.longitude !== this.locationCache.location.longitude) {
            console.log('🔧 Mise à jour cache avec coordonnées sanitisées');
            this.locationCache.location = {
              ...this.locationCache.location,
              latitude: validation.sanitized.latitude,
              longitude: validation.sanitized.longitude
            };
          }
          console.log('📍 Position récupérée du cache (sanitisée):', this.locationCache.location.locationName);
          return this.locationCache.location;
        } else {
          console.warn('🚨 Cache invalide, suppression et nouvelle géolocalisation');
          this.locationCache = null;
        }
      }
    }

    return new Promise(async (resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GEOLOCATION_NOT_SUPPORTED: Géolocalisation non supportée par ce navigateur'));
        return;
      }

      // Vérifier l'état des permissions AVANT de demander la position
      const permissionState = await this.checkPermissionState();

      if (permissionState === 'denied') {
        reject(new Error('GEOLOCATION_DENIED: Géolocalisation refusée par l\'utilisateur. Réactive-la dans les paramètres de ton navigateur.'));
        return;
      }

      if (permissionState === 'prompt') {
        console.log('📍 Demande de permission géolocalisation en cours...');
      }

      // Tentative 1: Haute précision (8s optimal)
      let coords: { latitude: number; longitude: number };
      try {
        coords = await this.attemptGeolocation(true, 8000);
        console.log('✅ Géolocalisation haute précision réussie');
      } catch (error) {
        console.warn('⚠️ Tentative haute précision échouée, fallback basse précision immédiat');
        
        // Tentative 2: Basse précision (5s WiFi/Cell towers)
        try {
          coords = await this.attemptGeolocation(false, 5000);
          console.log('✅ Géolocalisation basse précision réussie (fallback)');
        } catch (fallbackError) {
          console.warn('❌ Géolocalisation navigateur échouée, tentative IP Geolocation');
          
          // Tentative 3: IP Geolocation avec timeout (3s max)
          try {
            const ipPromise = this.getIPBasedLocation();
            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('IP Geolocation timeout')), 3000)
            );
            coords = await Promise.race([ipPromise, timeoutPromise]) as { latitude: number; longitude: number };
            console.log('✅ Géolocalisation IP réussie (fallback ultime)');
          } catch (ipError) {
            console.error('❌ Tous les fallbacks ont échoué');
            reject(new Error('GEOLOCATION_FAILED: Impossible de déterminer votre position. Active le GPS de ton appareil ou vérifie ta connexion.'));
            return;
          }
        }
      }

      const { latitude, longitude } = coords;
      
      // CRITIQUE: Sanitiser les coordonnées dès leur obtention pour compatibilité PostgreSQL
      const { CoordinateValidator } = await import('@/utils/coordinateValidation');
      const validation = CoordinateValidator.validateCoordinates(latitude, longitude);
      
      if (!validation.isValid || !validation.sanitized) {
        console.error('❌ Coordonnées invalides reçues du navigateur');
        reject(new Error('Coordonnées invalides'));
        return;
      }
      
      const sanitizedLatitude = validation.sanitized.latitude;
      const sanitizedLongitude = validation.sanitized.longitude;
      console.log('🔧 Coordonnées sanitisées (6 décimales max):', { 
        original: { latitude, longitude },
        sanitized: { latitude: sanitizedLatitude, longitude: sanitizedLongitude }
      });
      
      try {
        const locationName = await this.reverseGeocode(sanitizedLatitude, sanitizedLongitude);
        const location: LocationData = { 
          latitude: sanitizedLatitude, 
          longitude: sanitizedLongitude, 
          locationName 
        };
        
        // Mettre en cache
        this.locationCache = { location, timestamp: Date.now() };
        resolve(location);
      } catch (error) {
        console.warn('⚠️ Géocodage échoué, utilisation des coordonnées sanitisées');
        const location: LocationData = { 
          latitude: sanitizedLatitude, 
          longitude: sanitizedLongitude, 
          locationName: `${sanitizedLatitude.toFixed(4)}, ${sanitizedLongitude.toFixed(4)}` 
        };
        this.locationCache = { location, timestamp: Date.now() };
        resolve(location);
      }
    });
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      console.log('🔍 Reverse geocoding pour:', lat, lng);
      
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
      console.log('📍 Données géocodage reçues:', data.address);
      
      if (data.address) {
        const { 
          city, 
          town, 
          village, 
          suburb, 
          neighbourhood, 
          municipality, 
          postcode,
          county, // Département
          state    // Région
        } = data.address;
        
        // Stocker les métadonnées administratives pour la détection IDF
        this.lastLocationMetadata = {
          department: postcode?.substring(0, 2),
          region: state,
          postalCode: postcode
        };
        console.log('🌍 [GEOLOCATION] Métadonnées extraites:', this.lastLocationMetadata);
        
        const cityName = city || town || village || suburb || neighbourhood || municipality;
        
        // PRIORITÉ 1: Code postal + ville
        if (postcode && cityName) {
          const result = `${cityName} ${postcode}`;
          console.log('✅ Location avec code postal:', result);
          return result;
        }
        
        // PRIORITÉ 2: Code postal uniquement (si disponible)
        if (postcode) {
          const result = `Localisation ${postcode}`;
          console.log('✅ Location par code postal:', result);
          return result;
        }
        
        // PRIORITÉ 3: Ville uniquement
        if (cityName) {
          console.log('⚠️ Location sans code postal:', cityName);
          return cityName;
        }
        
        // FALLBACK: Département ou région
        if (county || state) {
          const fallback = county || state;
          console.log('⚠️ Location fallback:', fallback);
          return fallback;
        }
      }
      
      console.log('❌ Aucune localisation trouvée');
      return 'Localisation inconnue';
    } catch (error) {
      console.error('❌ Erreur reverse geocoding:', error);
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
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
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
