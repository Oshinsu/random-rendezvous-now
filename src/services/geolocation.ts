
export interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

export class GeolocationService {
  private static locationCache: { location: LocationData; timestamp: number } | null = null;
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static async getCurrentLocation(): Promise<LocationData> {
    // Vérifier le cache d'abord
    if (this.locationCache) {
      const now = Date.now();
      const age = now - this.locationCache.timestamp;
      if (age < this.CACHE_DURATION) {
        console.log('📍 Position récupérée du cache:', this.locationCache.location.locationName);
        return this.locationCache.location;
      }
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.warn('❌ Géolocalisation non supportée, fallback Paris');
        const parisLocation: LocationData = {
          latitude: 48.8566,
          longitude: 2.3522,
          locationName: 'Paris Centre'
        };
        this.locationCache = { location: parisLocation, timestamp: Date.now() };
        resolve(parisLocation);
        return;
      }

      let attemptCount = 0;
      const maxAttempts = 3;

      const tryGeolocation = (options: PositionOptions) => {
        attemptCount++;
        console.log(`📍 Tentative géolocalisation #${attemptCount}:`, options);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('✅ Position obtenue:', { latitude, longitude });
            
            try {
              const locationName = await this.reverseGeocode(latitude, longitude);
              const location: LocationData = { latitude, longitude, locationName };
              
              // Mettre en cache
              this.locationCache = { location, timestamp: Date.now() };
              resolve(location);
            } catch (error) {
              console.warn('⚠️ Géocodage échoué, utilisation des coordonnées brutes');
              const location: LocationData = { 
                latitude, 
                longitude, 
                locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
              };
              this.locationCache = { location, timestamp: Date.now() };
              resolve(location);
            }
          },
          (error) => {
            console.error(`❌ Erreur géolocalisation #${attemptCount}:`, error);
            
            // Essayer des options plus permissives
            if (attemptCount === 1) {
              tryGeolocation({
                enableHighAccuracy: false,
                timeout: 60000, // 60 secondes
                maximumAge: 300000 // 5 minutes
              });
              return;
            } else if (attemptCount === 2) {
              tryGeolocation({
                enableHighAccuracy: false,
                timeout: 90000, // 90 secondes
                maximumAge: 1800000 // 30 minutes
              });
              return;
            }
            
            // Dernier recours: fallback sur Paris
            console.warn('❌ Toutes les tentatives ont échoué, fallback sur Paris');
            const parisLocation: LocationData = {
              latitude: 48.8566,
              longitude: 2.3522,
              locationName: 'Paris Centre (fallback)'
            };
            this.locationCache = { location: parisLocation, timestamp: Date.now() };
            resolve(parisLocation);
          },
          options
        );
      };

      // Première tentative avec paramètres optimisés
      tryGeolocation({
        enableHighAccuracy: true,
        timeout: 30000, // 30 secondes
        maximumAge: 120000 // 2 minutes
      });
    });
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
        const { city, town, village, suburb, neighbourhood } = data.address;
        return city || town || village || suburb || neighbourhood || 'Localisation inconnue';
      }
      
      return 'Localisation inconnue';
    } catch (error) {
      throw error;
    }
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
