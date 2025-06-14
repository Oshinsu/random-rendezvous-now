
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
      console.log('🔍 [GooglePlacesService] Recherche de bars près de:', { latitude, longitude, radius });
      
      // CORRECTION: Utiliser l'URL complète de la fonction Edge
      const response = await fetch('https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/find-nearby-bars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs`
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius
        })
      });

      console.log('🌐 [GooglePlacesService] Réponse HTTP status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [GooglePlacesService] Erreur HTTP:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const selectedBar = await response.json();
      
      console.log('🍺 [GooglePlacesService] Bar sélectionné via Edge Function:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        rating: selectedBar.rating,
        location: selectedBar.geometry?.location
      });

      return selectedBar;
    } catch (error) {
      console.error('❌ [GooglePlacesService] Erreur lors de la recherche de bars:', error);
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
