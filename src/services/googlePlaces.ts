
interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
}

interface GooglePlacesResponse {
  results: PlaceResult[];
  status: string;
}

export class GooglePlacesService {
  private static readonly API_KEY = 'AIzaSyCySpM4EZYtGpOY6dhANdZ1ZzVfArTexBw';
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/place';

  static async findNearbyBars(latitude: number, longitude: number, radius: number = 5000): Promise<PlaceResult | null> {
    try {
      console.log('🔍 Recherche de bars près de:', { latitude, longitude, radius });
      
      const url = `${this.BASE_URL}/nearbysearch/json?` +
        `location=${latitude},${longitude}&` +
        `radius=${radius}&` +
        `type=bar&` +
        `key=${this.API_KEY}`;

      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.error('❌ Aucun bar trouvé:', data.status);
        return null;
      }

      // Filtrer les bars avec une note correcte et prendre le mieux noté
      const goodBars = data.results
        .filter(bar => bar.rating && bar.rating >= 3.5)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

      const selectedBar = goodBars[0] || data.results[0];
      
      console.log('🍺 Bar sélectionné:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        rating: selectedBar.rating,
        location: selectedBar.geometry.location
      });

      return selectedBar;
    } catch (error) {
      console.error('❌ Erreur lors de la recherche de bars:', error);
      return null;
    }
  }

  static async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const url = `${this.BASE_URL}/details/json?` +
        `place_id=${placeId}&` +
        `fields=name,formatted_address,geometry,rating,formatted_phone_number,opening_hours&` +
        `key=${this.API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.result;
      }
      
      console.error('❌ Erreur détails du lieu:', data.status);
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
      return null;
    }
  }
}
