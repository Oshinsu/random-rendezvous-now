
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

export class GooglePlacesService {
  static async findNearbyBars(latitude: number, longitude: number, radius: number = 5000): Promise<PlaceResult | null> {
    try {
      console.log('🔍 Recherche de bars près de:', { latitude, longitude, radius });
      
      // Appeler la Edge Function Supabase au lieu de l'API Google directement
      const response = await fetch('/functions/v1/find-nearby-bars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur Edge Function:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la recherche de bars');
      }

      const selectedBar = await response.json();
      
      console.log('🍺 Bar sélectionné via Edge Function:', {
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
      // Cette fonction pourrait aussi être déplacée vers une Edge Function si nécessaire
      console.log('📍 Récupération des détails pour place_id:', placeId);
      
      // Pour l'instant, on retourne null car on n'utilise pas encore cette fonction
      // Elle pourrait être implémentée plus tard si nécessaire
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
      return null;
    }
  }
}
