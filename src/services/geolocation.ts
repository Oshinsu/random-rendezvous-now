
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
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

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
        const { city, town, village, suburb, neighbourhood, postcode } = data.address;
        const cityName = city || town || village || suburb || neighbourhood;
        
        if (cityName && postcode) {
          return `${cityName} (${postcode})`;
        } else if (cityName) {
          return cityName;
        }
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

  static detectIleDeFrance(locationName: string, address?: string): boolean {
    const location = locationName.toLowerCase();
    const fullAddress = address?.toLowerCase() || '';
    
    // Codes postaux IDF (75, 77, 78, 91, 92, 93, 94, 95)
    const idfPostalCodes = /\b(75\d{3}|77\d{3}|78\d{3}|91\d{3}|92\d{3}|93\d{3}|94\d{3}|95\d{3})\b/;
    
    // Départements IDF
    const idfDepartments = [
      'paris', 'seine-et-marne', 'yvelines', 'essonne', 'hauts-de-seine', 
      'seine-saint-denis', 'val-de-marne', 'val-d\'oise'
    ];
    
    // Villes principales IDF (liste exhaustive des communes importantes)
    const idfCities = [
      // Paris et grandes villes
      'paris', 'boulogne-billancourt', 'saint-denis', 'argenteuil', 'montreuil',
      'créteil', 'nanterre', 'courbevoie', 'versailles', 'vitry-sur-seine',
      'colombes', 'asnières-sur-seine', 'aulnay-sous-bois', 'rueil-malmaison',
      'aubervilliers', 'champigny-sur-marne', 'saint-maur-des-fossés',
      'drancy', 'issy-les-moulineaux', 'levallois-perret', 'antony',
      'noisy-le-grand', 'villeneuve-saint-georges', 'clichy', 'ivry-sur-seine',
      'villejuif', 'épinay-sur-seine', 'meaux', 'vincennes', 'bobigny',
      'le blanc-mesnil', 'rosny-sous-bois', 'fontenay-sous-bois', 'bondy',
      
      // Villes manquantes importantes (Hauts-de-Seine 92)
      'chaville', 'sceaux', 'bagneux', 'malakoff', 'montrouge', 'vanves',
      'châtillon', 'clamart', 'meudon', 'sèvres', 'ville-d\'avray', 'marnes-la-coquette',
      'garches', 'vaucresson', 'la-celle-saint-cloud', 'bourg-la-reine', 'sceaux',
      'fontenay-aux-roses', 'le-plessis-robinson', 'châtenay-malabry', 'antony',
      'wissous', 'fresnes', 'rungis', 'thiais', 'chevilly-larue', 'l\'haÿ-les-roses',
      'cachan', 'arcueil', 'gentilly', 'le-kremlin-bicêtre', 'villejuif',
      
      // Val-de-Marne (94)
      'saint-mandé', 'charenton-le-pont', 'maisons-alfort', 'alfortville',
      'saint-maurice', 'joinville-le-pont', 'nogent-sur-marne', 'le-perreux-sur-marne',
      'bry-sur-marne', 'chennevières-sur-marne', 'la-varenne-saint-hilaire',
      'villiers-sur-marne', 'champigny-sur-marne', 'saint-maur-des-fossés',
      
      // Seine-Saint-Denis (93)
      'pantin', 'les-lilas', 'le-pré-saint-gervais', 'bagnolet', 'romainville',
      'noisy-le-sec', 'rosny-sous-bois', 'villemomble', 'montfermeil',
      'gagny', 'le-raincy', 'clichy-sous-bois', 'livry-gargan',
      
      // Val-d\'Oise (95)
      'enghien-les-bains', 'montmorency', 'eaubonne', 'ermont', 'franconville',
      'saint-gratien', 'sannois', 'argenteuil', 'bezons', 'colombes',
      
      // Yvelines (78)
      'le-chesnay', 'viroflay', 'chaville', 'meudon', 'issy-les-moulineaux',
      'boulogne-billancourt', 'saint-cloud', 'suresnes', 'puteaux', 'neuilly-sur-seine',
      
      // Essonne (91)
      'massy', 'palaiseau', 'orsay', 'gif-sur-yvette', 'bures-sur-yvette',
      'les-ulis', 'villebon-sur-yvette', 'verrières-le-buisson', 'chilly-mazarin',
      'longjumeau', 'savigny-sur-orge', 'viry-châtillon', 'juvisy-sur-orge'
    ];
    
    // Vérification par code postal
    if (idfPostalCodes.test(fullAddress) || idfPostalCodes.test(location)) {
      console.log('🗺️ [DÉTECTION IDF] Utilisateur IDF détecté par code postal');
      return true;
    }
    
    // Vérification par département
    if (idfDepartments.some(dept => location.includes(dept) || fullAddress.includes(dept))) {
      console.log('🗺️ [DÉTECTION IDF] Utilisateur IDF détecté par département');
      return true;
    }
    
    // Vérification par ville
    if (idfCities.some(city => location.includes(city) || fullAddress.includes(city))) {
      console.log('🗺️ [DÉTECTION IDF] Utilisateur IDF détecté par ville');
      return true;
    }
    
    console.log('🗺️ [DÉTECTION IDF] Utilisateur hors IDF');
    return false;
  }
}
