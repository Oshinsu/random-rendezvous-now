
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

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('✅ Position obtenue (brute):', { latitude, longitude });
          
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
        },
        (error) => {
          console.error('❌ Erreur géolocalisation:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );
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
