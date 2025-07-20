
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
}

export class GooglePlacesService {
  /**
   * Recherche AMÉLIORÉE de bars - avec filtrage intelligent
   */
  static async findNearbyBars(latitude: number, longitude: number): Promise<PlaceResult | null> {
    try {
      console.log('🔍 [GooglePlacesService] Recherche améliorée de bars:', { latitude, longitude });
      
      const response = await fetch('https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/simple-bar-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs`
        },
        body: JSON.stringify({ latitude, longitude })
      });

      if (!response.ok) {
        console.error('❌ [GooglePlacesService] Erreur HTTP:', response.status);
        const errorText = await response.text();
        console.error('❌ [GooglePlacesService] Détails erreur:', errorText);
        return null;
      }

      const selectedBar = await response.json();
      
      if (!selectedBar || !selectedBar.name) {
        console.error('❌ [GooglePlacesService] Aucun bar trouvé dans la réponse');
        return null;
      }

      console.log('🍺 [GooglePlacesService] Bar sélectionné:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        coordinates: selectedBar.geometry?.location
      });
      
      return selectedBar;
      
    } catch (error) {
      console.error('❌ [GooglePlacesService] Erreur de recherche:', error);
      return null;
    }
  }

  static async getPlaceDetails(placeId: string): Promise<any> {
    // Fonction simplifiée - pas utilisée pour l'instant
    return null;
  }
}
