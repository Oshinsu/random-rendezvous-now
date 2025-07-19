
import { EnhancedGooglePlacesService } from './enhancedGooglePlaces';

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
   * Recherche de bars avec redirection vers le service amélioré
   * @deprecated Utilisez EnhancedGooglePlacesService.findValidatedBarsNearby à la place
   */
  static async findNearbyBars(
    latitude: number, 
    longitude: number, 
    radius: number = 15000
  ): Promise<PlaceResult | null> {
    console.log('⚠️ [DEPRECATED] GooglePlacesService.findNearbyBars est déprécié, redirection vers service amélioré');
    
    try {
      const searchResult = await EnhancedGooglePlacesService.findValidatedBarsNearby(
        latitude, 
        longitude, 
        `Position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
      );

      if (!searchResult.bar) {
        console.log('❌ [DEPRECATED] Aucun bar trouvé via service amélioré');
        return null;
      }

      // Conversion vers l'ancien format pour compatibilité
      const compatibleResult: PlaceResult = {
        place_id: searchResult.bar.place_id,
        name: searchResult.bar.name,
        formatted_address: searchResult.bar.formatted_address,
        geometry: searchResult.bar.geometry,
        rating: searchResult.bar.rating,
        price_level: searchResult.bar.price_level,
        primaryType: searchResult.bar.primaryType,
        businessStatus: searchResult.bar.business_status
      };

      console.log('✅ [DEPRECATED] Conversion réussie vers ancien format');
      return compatibleResult;
    } catch (error) {
      console.error('❌ [DEPRECATED] Erreur lors de la redirection:', error);
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
      console.log('📍 Récupération des détails pour place_id:', placeId);
      return null; // Non implémenté pour l'instant
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
      return null;
    }
  }
}
