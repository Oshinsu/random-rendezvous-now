
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
  business_status?: string;
}

export class GooglePlacesService {
  /**
   * Recherche SIMPLIFIÉE avec Google Places API v1 - bars ouverts uniquement
   */
  static async findNearbyBars(latitude: number, longitude: number, radius: number = 5000): Promise<PlaceResult | null> {
    try {
      console.log('🔍 [GooglePlacesService] Recherche avec Google Places API v1 (bars ouverts uniquement):', { latitude, longitude, radius });
      
      // Validation stricte des coordonnées
      if (!this.validateCoordinatesStrict(latitude, longitude)) {
        console.error('❌ [GooglePlacesService] Coordonnées invalides:', { latitude, longitude });
        return null;
      }

      // Appel à l'Edge Function mise à jour
      let response: Response;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
          
          response = await fetch('https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/find-nearby-bars', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs`
            },
            body: JSON.stringify({
              latitude,
              longitude,
              radius
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            break;
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ [GooglePlacesService] Tentative ${retryCount}/${maxRetries + 1} échouée:`, error);
          
          if (retryCount > maxRetries) {
            throw new Error(`Échec après ${maxRetries + 1} tentatives`);
          }
          
          // Backoff exponentiel
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      console.log('🌐 [GooglePlacesService] Réponse HTTP reçue, status:', response!.status);

      if (!response!.ok) {
        const errorText = await response!.text();
        console.error('❌ [GooglePlacesService] Erreur HTTP:', response!.status, errorText);
        throw new Error(`HTTP ${response!.status}: ${errorText}`);
      }

      const selectedBar = await response!.json();
      
      // Validation de la réponse
      if (!selectedBar || !selectedBar.name) {
        console.error('❌ [GooglePlacesService] Réponse invalide:', selectedBar);
        return null;
      }

      console.log('🍺 [GooglePlacesService] Bar sélectionné (Google Places API v1):', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        rating: selectedBar.rating,
        business_status: selectedBar.business_status,
        location: selectedBar.geometry?.location
      });

      return selectedBar;
    } catch (error) {
      console.error('❌ [GooglePlacesService] Erreur globale:', error);
      return null;
    }
  }

  /**
   * Validation stricte des coordonnées
   */
  private static validateCoordinatesStrict(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
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
