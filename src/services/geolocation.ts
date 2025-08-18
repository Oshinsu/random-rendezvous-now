
export interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

export class GeolocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur'));
        return;
      }

      // D'abord essayer avec les paramètres standards
      const tryGeolocation = (options: PositionOptions) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              const locationName = await this.reverseGeocode(latitude, longitude);
              resolve({ latitude, longitude, locationName });
            } catch (error) {
              // Si le géocodage échoue, on utilise quand même les coordonnées
              resolve({ 
                latitude, 
                longitude, 
                locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
              });
            }
          },
          (error) => {
            // Si échec avec les premières options, essayer des options plus permissives
            if (options.enableHighAccuracy && options.timeout === 5000) {
              tryGeolocation({
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 600000 // 10 minutes
              });
              return;
            }
            
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
          options
        );
      };

      // Première tentative avec haute précision
      tryGeolocation({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000
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
