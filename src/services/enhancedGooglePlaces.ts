
/**
 * Enhanced Google Places Service
 * Service Google Places amélioré avec validation stricte
 */

import { StrictBarValidationService, ValidatedPlace } from './barValidation';
import { MartiniqueGeolocationService, MartiniqueLocation } from './martinqueGeolocation';

export interface EnhancedSearchResult {
  bar: ValidatedPlace | null;
  searchMetadata: {
    totalCandidates: number;
    validCandidates: number;
    rejectedCandidates: number;
    searchLocation: MartiniqueLocation;
    searchRadius: number;
    confidence: 'high' | 'medium' | 'low';
  };
}

/**
 * Service Google Places amélioré avec validation stricte
 */
export class EnhancedGooglePlacesService {
  /**
   * Recherche améliorée de bars avec validation stricte
   */
  static async findValidatedBarsNearby(
    userLatitude?: number,
    userLongitude?: number,
    userLocationName?: string
  ): Promise<EnhancedSearchResult> {
    console.log('🚀 [ENHANCED GOOGLE PLACES] Début recherche améliorée avec validation stricte');

    // 1. Validation et correction de la géolocalisation
    const searchLocation = MartiniqueGeolocationService.validateAndCorrectUserLocation(
      userLatitude, userLongitude, userLocationName
    );

    const searchRadius = MartiniqueGeolocationService.getOptimalSearchRadius(searchLocation.confidence);

    console.log('📍 [ENHANCED GOOGLE PLACES] Position de recherche validée:', {
      location: searchLocation,
      radius: searchRadius
    });

    // 2. Appel à l'Edge Function améliorée
    let response: Response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // Timeout augmenté

        response = await fetch('https://xhrievvdnajvylyrowwu.supabase.co/functions/v1/find-nearby-bars', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocmlldnZkbmFqdnlseXJvd3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTQ1MzUsImV4cCI6MjA2NTQ3MDUzNX0.RfwNUnsTFAzfRqxiqCOtunXBTMJj90MKWOm1iwzVBAs`
          },
          body: JSON.stringify({
            latitude: searchLocation.latitude,
            longitude: searchLocation.longitude,
            radius: searchRadius,
            enhanced: true // Flag pour activer la validation améliorée
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
        console.warn(`⚠️ [ENHANCED GOOGLE PLACES] Tentative ${retryCount}/${maxRetries + 1} échouée:`, error);
        
        if (retryCount > maxRetries) {
          throw new Error(`Échec après ${maxRetries + 1} tentatives avec validation améliorée`);
        }
        
        // Backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    console.log('🌐 [ENHANCED GOOGLE PLACES] Réponse reçue, status:', response!.status);

    if (!response!.ok) {
      const errorText = await response!.text();
      console.error('❌ [ENHANCED GOOGLE PLACES] Erreur HTTP:', response!.status, errorText);
      throw new Error(`HTTP ${response!.status}: ${errorText}`);
    }

    const rawResult = await response!.json();
    console.log('📋 [ENHANCED GOOGLE PLACES] Données brutes reçues:', JSON.stringify(rawResult, null, 2));

    // 3. Validation stricte côté client (double sécurité)
    if (!rawResult || !rawResult.name) {
      console.error('❌ [ENHANCED GOOGLE PLACES] Réponse invalide:', rawResult);
      return {
        bar: null,
        searchMetadata: {
          totalCandidates: 0,
          validCandidates: 0,
          rejectedCandidates: 0,
          searchLocation,
          searchRadius,
          confidence: 'low'
        }
      };
    }

    // Validation stricte supplémentaire côté client
    const clientValidation = StrictBarValidationService.validateBarCandidate(rawResult);
    
    if (!clientValidation.isValid || clientValidation.confidence === 'low') {
      console.error('❌ [ENHANCED GOOGLE PLACES] Bar rejeté par validation client:', {
        name: rawResult.name,
        validation: clientValidation
      });
      return {
        bar: null,
        searchMetadata: {
          totalCandidates: 1,
          validCandidates: 0,
          rejectedCandidates: 1,
          searchLocation,
          searchRadius,
          confidence: 'low'
        }
      };
    }

    // 4. Extraction robuste du nom
    const validatedBar: ValidatedPlace = {
      ...rawResult,
      name: StrictBarValidationService.extractBarNameRobust(rawResult)
    };

    console.log('✅ [ENHANCED GOOGLE PLACES] Bar validé avec succès:', {
      name: validatedBar.name,
      primaryType: validatedBar.primaryType,
      business_status: validatedBar.business_status,
      validation: clientValidation,
      searchLocation: searchLocation.locationName
    });

    return {
      bar: validatedBar,
      searchMetadata: {
        totalCandidates: 1,
        validCandidates: 1,
        rejectedCandidates: 0,
        searchLocation,
        searchRadius,
        confidence: clientValidation.confidence
      }
    };
  }

  /**
   * Validation stricte des coordonnées
   */
  static validateCoordinatesStrict(lat: number, lng: number): boolean {
    return StrictBarValidationService.validateCoordinatesStrict(lat, lng);
  }
}
