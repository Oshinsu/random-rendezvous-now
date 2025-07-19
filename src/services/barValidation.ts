
/**
 * Bar Validation Service
 * Service de validation stricte des bars avec critères multiples
 */

export interface BarValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ValidatedPlace {
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
  types?: string[];
  business_status?: string;
  primaryType?: string;
  opening_hours?: {
    open_now?: boolean;
  };
}

/**
 * Service de validation stricte des bars
 */
export class StrictBarValidationService {
  // Mots-clés interdits (services non-bar)
  private static readonly FORBIDDEN_KEYWORDS = [
    // Français
    'service', 'services', 'bureau', 'office', 'entreprise', 'company', 'société',
    'magasin', 'boutique', 'shop', 'store', 'pharmacie', 'pharmacy', 'clinique',
    'clinic', 'médical', 'medical', 'hôtel', 'hotel', 'restaurant', 'école', 
    'school', 'université', 'university', 'banque', 'bank', 'assurance', 
    'insurance', 'immobilier', 'real estate', 'garage', 'station', 'supermarché', 
    'supermarket', 'centre commercial', 'shopping center', 'église', 'church',
    // Anglais
    'dental', 'hospital', 'market', 'mall', 'center', 'centre', 'temple',
    'mosque', 'automotive', 'repair', 'finance', 'legal', 'lawyer'
  ];

  // Mots-clés obligatoires pour les bars
  private static readonly REQUIRED_BAR_KEYWORDS = [
    'bar', 'pub', 'tavern', 'taverne', 'bistro', 'brasserie', 'lounge', 
    'cocktail', 'wine bar', 'beer', 'bière', 'drinks', 'boissons', 
    'alcohol', 'alcool', 'spirits', 'brewery', 'brasserie'
  ];

  // Types Google Places valides pour les bars
  private static readonly VALID_PRIMARY_TYPES = [
    'bar', 'night_club', 'liquor_store'
  ];

  // Types Google Places autorisés en complément
  private static readonly ALLOWED_SECONDARY_TYPES = [
    'establishment', 'food', 'point_of_interest', 'meal_takeaway'
  ];

  // Types Google Places interdits
  private static readonly FORBIDDEN_TYPES = [
    'store', 'shopping_mall', 'doctor', 'hospital', 'school', 'church',
    'pharmacy', 'gas_station', 'car_repair', 'bank', 'insurance_agency',
    'real_estate_agency', 'lawyer', 'dentist', 'veterinary_care'
  ];

  /**
   * Validation stricte d'un candidat bar
   */
  static validateBarCandidate(place: ValidatedPlace): BarValidationResult {
    const result: BarValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: [],
      confidence: 'low'
    };

    console.log('🔍 [STRICT VALIDATION] Validation stricte du candidat:', {
      name: place.name,
      primaryType: place.primaryType,
      types: place.types,
      business_status: place.business_status
    });

    // 1. Validation du type principal (critère le plus important)
    if (place.primaryType && this.VALID_PRIMARY_TYPES.includes(place.primaryType)) {
      result.score += 60;
      result.reasons.push(`Type principal valide: ${place.primaryType}`);
    } else {
      result.score -= 40;
      result.warnings.push(`Type principal invalide: ${place.primaryType || 'inconnu'}`);
    }

    // 2. Validation stricte du nom (mots-clés interdits)
    const nameLower = place.name.toLowerCase();
    const hasForbiddenKeywords = this.FORBIDDEN_KEYWORDS.some(keyword => 
      nameLower.includes(keyword.toLowerCase())
    );

    if (hasForbiddenKeywords) {
      result.score -= 50;
      result.reasons.push('Nom contient des mots-clés de service non-bar');
      result.warnings.push('REJETÉ: Probablement un service, pas un bar');
      // Rejet immédiat pour les services
      return { ...result, isValid: false, confidence: 'high' };
    }

    // 3. Validation des mots-clés de bar requis
    const hasBarKeywords = this.REQUIRED_BAR_KEYWORDS.some(keyword => 
      nameLower.includes(keyword.toLowerCase())
    );

    if (hasBarKeywords) {
      result.score += 30;
      result.reasons.push('Nom contient des mots-clés de bar');
    } else {
      result.score -= 20;
      result.warnings.push('Nom ne contient pas de mots-clés de bar évidents');
    }

    // 4. Validation des types secondaires
    if (place.types && place.types.length > 0) {
      const hasForbiddenTypes = place.types.some(type => 
        this.FORBIDDEN_TYPES.includes(type)
      );

      if (hasForbiddenTypes) {
        result.score -= 60;
        result.reasons.push('Contient des types interdits');
        result.warnings.push('REJETÉ: Types non-compatibles avec un bar');
        // Rejet immédiat pour les types interdits
        return { ...result, isValid: false, confidence: 'high' };
      }

      const hasAllowedTypes = place.types.some(type => 
        this.ALLOWED_SECONDARY_TYPES.includes(type)
      );

      if (hasAllowedTypes) {
        result.score += 10;
        result.reasons.push('Types secondaires compatibles');
      }
    }

    // 5. Validation du statut d'entreprise
    if (place.business_status === 'OPERATIONAL') {
      result.score += 15;
      result.reasons.push('Entreprise opérationnelle');
    } else if (place.business_status === 'CLOSED_PERMANENTLY') {
      result.score -= 100;
      result.reasons.push('Entreprise fermée définitivement');
      return { ...result, isValid: false, confidence: 'high' };
    }

    // 6. Validation de la note (bonus)
    if (place.rating && place.rating >= 4.0) {
      result.score += 10;
      result.reasons.push('Excellente note');
    } else if (place.rating && place.rating >= 3.5) {
      result.score += 5;
      result.reasons.push('Bonne note');
    }

    // 7. Validation finale avec seuil strict
    const MIN_SCORE_THRESHOLD = 70; // Seuil très élevé
    result.isValid = result.score >= MIN_SCORE_THRESHOLD;

    // Détermination du niveau de confiance
    if (result.score >= 90) {
      result.confidence = 'high';
    } else if (result.score >= 70) {
      result.confidence = 'medium';
    } else {
      result.confidence = 'low';
    }

    console.log('📊 [STRICT VALIDATION] Résultat validation stricte:', {
      name: place.name,
      score: result.score,
      isValid: result.isValid,
      confidence: result.confidence,
      reasons: result.reasons,
      warnings: result.warnings
    });

    return result;
  }

  /**
   * Filtrage et classement strict des bars
   */
  static filterAndRankBarsStrict(places: ValidatedPlace[]): ValidatedPlace[] {
    console.log('🔄 [STRICT FILTERING] Filtrage strict de', places.length, 'candidats');

    const validatedBars = places
      .map(place => ({
        place,
        validation: this.validateBarCandidate(place)
      }))
      .filter(item => item.validation.isValid && item.validation.confidence !== 'low')
      .sort((a, b) => {
        // Trier par confiance puis par score
        if (a.validation.confidence !== b.validation.confidence) {
          const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return confidenceOrder[b.validation.confidence] - confidenceOrder[a.validation.confidence];
        }
        return b.validation.score - a.validation.score;
      })
      .map(item => item.place);

    console.log('✅ [STRICT FILTERING] Filtrage terminé:', {
      input: places.length,
      output: validatedBars.length,
      rejectionRate: ((places.length - validatedBars.length) / places.length * 100).toFixed(1) + '%'
    });

    return validatedBars;
  }

  /**
   * Validation stricte des coordonnées
   */
  static validateCoordinatesStrict(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    if (lat === 0 && lng === 0) return false; // Null Island
    return true;
  }

  /**
   * Extraction robuste du nom de bar
   */
  static extractBarNameRobust(place: ValidatedPlace): string {
    console.log('🏷️ [STRICT NAME EXTRACTION] Extraction du nom:', {
      name: place.name,
      formatted_address: place.formatted_address
    });

    // Priorité 1: Nom si valide
    if (place.name && 
        !place.name.startsWith('places/') && 
        !place.name.startsWith('ChIJ') &&
        place.name.length > 2) {
      console.log('✅ [STRICT NAME EXTRACTION] Utilisation du nom:', place.name);
      return place.name;
    }

    // Priorité 2: Adresse formatée
    if (place.formatted_address) {
      const addressParts = place.formatted_address.split(',');
      const possibleName = addressParts[0].trim();
      
      if (possibleName && 
          possibleName.length > 2 && 
          !possibleName.match(/^\d+/)) {
        console.log('⚠️ [STRICT NAME EXTRACTION] Utilisation adresse:', possibleName);
        return possibleName;
      }
    }

    // Priorité 3: Nom générique
    const fallbackName = `Bar ${place.place_id.slice(-8)}`;
    console.log('⚠️ [STRICT NAME EXTRACTION] Nom générique:', fallbackName);
    return fallbackName;
  }
}
