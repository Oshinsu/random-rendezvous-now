
interface EnhancedPlaceResult {
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
  opening_hours?: {
    open_now?: boolean;
  };
  primaryType?: string;
}

interface BarValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
}

/**
 * Enhanced Bar Selection Service with improved filtering and validation
 */
export class EnhancedBarSelectionService {
  // Blacklist of non-bar keywords in various languages
  private static readonly NON_BAR_KEYWORDS = [
    // French
    'service', 'services', 'bureau', 'office', 'entreprise', 'company', 'société',
    'magasin', 'boutique', 'shop', 'store', 'pharmacie', 'pharmacy', 'clinique',
    'clinic', 'hôtel', 'hotel', 'restaurant', 'école', 'school', 'université',
    'banque', 'bank', 'assurance', 'insurance', 'immobilier', 'real estate',
    'garage', 'station', 'supermarché', 'supermarket', 'centre commercial',
    'shopping center', 'église', 'church', 'temple', 'mosquée', 'mosque',
    // English
    'services', 'office', 'company', 'corporation', 'ltd', 'inc', 'llc',
    'medical', 'dental', 'hospital', 'clinic', 'pharmacy', 'hotel', 'motel',
    'school', 'university', 'college', 'bank', 'insurance', 'garage',
    'station', 'market', 'mall', 'center', 'centre', 'church'
  ];

  // Required bar-related keywords
  private static readonly BAR_KEYWORDS = [
    'bar', 'pub', 'tavern', 'bistro', 'brasserie', 'lounge', 'cocktail',
    'wine bar', 'beer', 'drinks', 'alcohol', 'spirits', 'brewery'
  ];

  // Valid bar types from Google Places
  private static readonly VALID_BAR_TYPES = [
    'bar', 'night_club', 'liquor_store', 'establishment', 'food', 'point_of_interest'
  ];

  /**
   * Enhanced bar validation with multiple criteria
   */
  static validateBarCandidate(place: EnhancedPlaceResult): BarValidationResult {
    const result: BarValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: []
    };

    console.log('🔍 [ENHANCED VALIDATION] Validating bar candidate:', {
      name: place.name,
      primaryType: place.primaryType,
      types: place.types,
      business_status: place.business_status
    });

    // 1. Primary type validation (highest priority)
    if (place.primaryType === 'bar') {
      result.score += 50;
      result.reasons.push('Primary type is bar');
    } else {
      result.warnings.push('Primary type is not bar');
    }

    // 2. Name validation - check for non-bar keywords
    const nameLower = place.name.toLowerCase();
    const hasNonBarKeywords = this.NON_BAR_KEYWORDS.some(keyword => 
      nameLower.includes(keyword.toLowerCase())
    );

    if (hasNonBarKeywords) {
      result.score -= 30;
      result.reasons.push('Name contains non-bar keywords');
      result.warnings.push('Potentially not a bar based on name');
    }

    // 3. Check for bar-related keywords in name
    const hasBarKeywords = this.BAR_KEYWORDS.some(keyword => 
      nameLower.includes(keyword.toLowerCase())
    );

    if (hasBarKeywords) {
      result.score += 20;
      result.reasons.push('Name contains bar-related keywords');
    }

    // 4. Types validation
    if (place.types && place.types.length > 0) {
      const validTypes = place.types.filter(type => 
        this.VALID_BAR_TYPES.includes(type)
      );
      
      if (validTypes.length > 0) {
        result.score += 15;
        result.reasons.push(`Has valid bar types: ${validTypes.join(', ')}`);
      }

      // Check for problematic types
      const problematicTypes = ['store', 'doctor', 'hospital', 'school', 'church'];
      const hasProblematicTypes = place.types.some(type => 
        problematicTypes.includes(type)
      );

      if (hasProblematicTypes) {
        result.score -= 25;
        result.reasons.push('Has non-bar types');
      }
    }

    // 5. Business status validation
    if (place.business_status === 'OPERATIONAL') {
      result.score += 10;
      result.reasons.push('Business is operational');
    } else if (place.business_status === 'CLOSED_PERMANENTLY') {
      result.score -= 50;
      result.reasons.push('Business is permanently closed');
    }

    // 6. Rating validation (optional bonus)
    if (place.rating && place.rating >= 3.5) {
      result.score += 5;
      result.reasons.push('Good rating');
    }

    // 7. Final validation
    result.isValid = result.score >= 40; // Minimum score threshold

    console.log('📊 [ENHANCED VALIDATION] Validation result:', {
      name: place.name,
      score: result.score,
      isValid: result.isValid,
      reasons: result.reasons,
      warnings: result.warnings
    });

    return result;
  }

  /**
   * Filter and rank bar candidates
   */
  static filterAndRankBars(places: EnhancedPlaceResult[]): EnhancedPlaceResult[] {
    console.log('🔄 [ENHANCED FILTERING] Processing', places.length, 'candidates');

    const validatedBars = places
      .map(place => ({
        place,
        validation: this.validateBarCandidate(place)
      }))
      .filter(item => item.validation.isValid)
      .sort((a, b) => b.validation.score - a.validation.score) // Sort by score descending
      .map(item => item.place);

    console.log('✅ [ENHANCED FILTERING] Filtered to', validatedBars.length, 'valid bars');

    return validatedBars;
  }

  /**
   * Extract robust bar name with enhanced fallbacks
   */
  static extractRobustBarName(place: EnhancedPlaceResult): string {
    console.log('🏷️ [ENHANCED NAME EXTRACTION] Processing:', {
      name: place.name,
      formatted_address: place.formatted_address
    });

    // Priority 1: Use name if it doesn't look like a Place ID
    if (place.name && 
        !place.name.startsWith('places/') && 
        !place.name.startsWith('ChIJ') &&
        place.name.length > 2) {
      console.log('✅ [ENHANCED NAME EXTRACTION] Using place name:', place.name);
      return place.name;
    }

    // Priority 2: Extract from formatted address
    if (place.formatted_address) {
      const addressParts = place.formatted_address.split(',');
      const possibleName = addressParts[0].trim();
      
      if (possibleName && 
          possibleName.length > 2 && 
          !possibleName.match(/^\d+/)) { // Not starting with numbers
        console.log('⚠️ [ENHANCED NAME EXTRACTION] Using address-based name:', possibleName);
        return possibleName;
      }
    }

    // Priority 3: Generic fallback
    const fallbackName = `Bar ${place.place_id.slice(-8)}`;
    console.log('⚠️ [ENHANCED NAME EXTRACTION] Using generic fallback:', fallbackName);
    return fallbackName;
  }

  /**
   * Select best bar from filtered candidates
   */
  static selectBestBar(validBars: EnhancedPlaceResult[]): EnhancedPlaceResult | null {
    if (validBars.length === 0) {
      console.log('❌ [ENHANCED SELECTION] No valid bars available');
      return null;
    }

    // For now, select the first one (highest scored from filtering)
    const selectedBar = validBars[0];
    
    console.log('🎯 [ENHANCED SELECTION] Selected bar:', {
      name: selectedBar.name,
      primaryType: selectedBar.primaryType,
      rating: selectedBar.rating,
      business_status: selectedBar.business_status
    });

    return selectedBar;
  }

  /**
   * Validate coordinates with enhanced checks
   */
  static validateCoordinatesStrict(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    
    // Additional checks for common invalid coordinates
    if (lat === 0 && lng === 0) return false; // Null Island
    
    return true;
  }
}
