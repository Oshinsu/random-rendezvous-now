
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
  primaryType?: string;
  businessStatus?: string;
}

export class GooglePlacesService {
  /**
   * Recherche AMÉLIORÉE de bars avec validation multi-critères
   */
  static async findNearbyBars(latitude: number, longitude: number, radius: number = 10000): Promise<PlaceResult | null> {
    try {
      console.log('🔍 [GooglePlacesService ENHANCED] Recherche AMÉLIORÉE avec validation multi-critères:', { latitude, longitude, radius });
      
      // Validation stricte des coordonnées
      if (!this.validateCoordinatesStrict(latitude, longitude)) {
        console.error('❌ [GooglePlacesService ENHANCED] Coordonnées invalides:', { latitude, longitude });
        return null;
      }

      // Appel amélioré à l'Edge Function
      let response: Response;
      let retryCount = 0;
      const maxRetries = 3; // Increased retries
      
      while (retryCount <= maxRetries) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
          
          response = await fetch('https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/find-nearby-bars', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs`
            },
            body: JSON.stringify({
              latitude,
              longitude,
              radius: Math.max(radius, 15000) // Increased minimum radius
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
          console.warn(`⚠️ [GooglePlacesService ENHANCED] Tentative ${retryCount}/${maxRetries + 1} échouée:`, error);
          
          if (retryCount > maxRetries) {
            throw new Error(`Échec après ${maxRetries + 1} tentatives avec validation améliorée`);
          }
          
          // Backoff exponentiel amélioré
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      console.log('🌐 [GooglePlacesService ENHANCED] Réponse HTTP reçue avec validation améliorée, status:', response!.status);

      if (!response!.ok) {
        const errorText = await response!.text();
        console.error('❌ [GooglePlacesService ENHANCED] Erreur HTTP:', response!.status, errorText);
        throw new Error(`HTTP ${response!.status}: ${errorText}`);
      }

      const selectedBar = await response!.json();
      
      // Validation de la réponse avec logs détaillés améliorés
      console.log('📋 [GooglePlacesService ENHANCED] Données brutes reçues avec validation:', JSON.stringify(selectedBar, null, 2));
      
      if (!selectedBar || !selectedBar.name) {
        console.error('❌ [GooglePlacesService ENHANCED] Réponse invalide:', selectedBar);
        return null;
      }

      // Validation stricte améliorée du nom de bar
      if (selectedBar.name.startsWith('places/') || selectedBar.name.startsWith('ChIJ')) {
        console.error('❌ [GooglePlacesService ENHANCED] Nom de bar invalide détecté:', {
          name: selectedBar.name,
          place_id: selectedBar.place_id,
          primaryType: selectedBar.primaryType,
          enhancedValidation: true,
          rawData: selectedBar
        });
        return null;
      }

      // Validation supplémentaire pour les services non-bar
      const nameLower = selectedBar.name.toLowerCase();
      const problematicKeywords = ['service', 'services', 'office', 'company', 'entreprise'];
      if (problematicKeywords.some(keyword => nameLower.includes(keyword))) {
        console.warn('⚠️ [GooglePlacesService ENHANCED] Bar potentiellement non-valide détecté:', {
          name: selectedBar.name,
          reason: 'Contains non-bar keywords',
          enhancedValidation: true
        });
        // Continue but log the warning - let the enhanced validation handle this
      }

      console.log('🍺 [GooglePlacesService ENHANCED] Bar sélectionné avec validation améliorée:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        rating: selectedBar.rating,
        primaryType: selectedBar.primaryType,
        businessStatus: selectedBar.businessStatus,
        location: selectedBar.geometry?.location,
        enhancedValidation: true
      });

      return selectedBar;
    } catch (error) {
      console.error('❌ [GooglePlacesService ENHANCED] Erreur globale:', error);
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
