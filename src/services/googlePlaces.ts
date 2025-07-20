
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
   * Recherche de bars via l'edge function unifiée
   */
  static async findNearbyBars(latitude: number, longitude: number): Promise<PlaceResult | null> {
    try {
      console.log('🔍 [GooglePlacesService] Recherche de bars:', { latitude, longitude });
      
      const response = await fetch('https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/simple-auto-assign-bar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs`
        },
        body: JSON.stringify({ 
          latitude, 
          longitude,
          manual_search: true 
        })
      });

      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status);
        return null;
      }

      const result = await response.json();
      
      if (!result.success || !result.bar) {
        console.error('❌ Aucun bar trouvé');
        return null;
      }

      console.log('🍺 Bar trouvé:', result.bar.name);
      return result.bar;
      
    } catch (error) {
      console.error('❌ Erreur de recherche:', error);
      return null;
    }
  }

  static async getPlaceDetails(placeId: string): Promise<any> {
    // Fonction simplifiée - pas utilisée pour l'instant
    return null;
  }
}
