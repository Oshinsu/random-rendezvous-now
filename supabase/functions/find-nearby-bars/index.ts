
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewPlaceResult {
  id: string;
  name: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  priceLevel?: string;
  primaryType?: string;
  types?: string[];
  businessStatus?: string;
  currentOpeningHours?: {
    openNow?: boolean;
  };
}

interface NewGooglePlacesResponse {
  places: NewPlaceResult[];
}

interface BarValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
}

// Enhanced bar validation with multiple criteria
class EnhancedBarValidator {
  // Blacklist of non-bar keywords in various languages
  private static readonly NON_BAR_KEYWORDS = [
    'service', 'services', 'bureau', 'office', 'entreprise', 'company', 'société',
    'magasin', 'boutique', 'shop', 'store', 'pharmacie', 'pharmacy', 'clinique',
    'clinic', 'hôtel', 'hotel', 'restaurant', 'école', 'school', 'université',
    'banque', 'bank', 'assurance', 'insurance', 'immobilier', 'real estate',
    'garage', 'station', 'supermarché', 'supermarket', 'centre commercial',
    'shopping center', 'église', 'church', 'temple', 'mosquée', 'mosque',
    'medical', 'dental', 'hospital', 'market', 'mall', 'center', 'centre'
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

  static validateBarCandidate(place: NewPlaceResult): BarValidationResult {
    const result: BarValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: []
    };

    console.log('🔍 [ENHANCED VALIDATION] Validating bar candidate:', {
      name: place.name,
      displayName: place.displayName?.text,
      primaryType: place.primaryType,
      types: place.types,
      business_status: place.businessStatus
    });

    // 1. Primary type validation (highest priority)
    if (place.primaryType === 'bar') {
      result.score += 50;
      result.reasons.push('Primary type is bar');
    } else {
      result.warnings.push(`Primary type is ${place.primaryType}, not bar`);
    }

    // 2. Name validation - check for non-bar keywords
    const displayName = place.displayName?.text || place.name || '';
    const nameLower = displayName.toLowerCase();
    
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
    if (place.businessStatus === 'OPERATIONAL') {
      result.score += 10;
      result.reasons.push('Business is operational');
    } else if (place.businessStatus === 'CLOSED_PERMANENTLY') {
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
      name: displayName,
      score: result.score,
      isValid: result.isValid,
      reasons: result.reasons,
      warnings: result.warnings
    });

    return result;
  }
}

// Extraction ROBUSTE du nom du bar avec système de fallback amélioré
function extractBarName(place: NewPlaceResult): string {
  console.log('🔍 [ENHANCED NAME EXTRACTION] Données complètes du bar:', JSON.stringify(place, null, 2));

  // Priorité 1: displayName.text (le plus fiable)
  if (place.displayName?.text && 
      !place.displayName.text.startsWith('places/') && 
      !place.displayName.text.startsWith('ChIJ') &&
      place.displayName.text.length > 2) {
    console.log('✅ [ENHANCED NAME EXTRACTION] Utilisation displayName.text:', place.displayName.text);
    return place.displayName.text;
  }

  // Priorité 2: name (si ce n'est pas un Place ID)
  if (place.name && 
      !place.name.startsWith('places/') && 
      !place.name.startsWith('ChIJ') &&
      place.name.length > 2) {
    console.log('✅ [ENHANCED NAME EXTRACTION] Utilisation name:', place.name);
    return place.name;
  }

  // Priorité 3: Fallback sur adresse formatée
  if (place.formattedAddress) {
    const addressParts = place.formattedAddress.split(',');
    const possibleName = addressParts[0].trim();
    if (possibleName && 
        possibleName.length > 2 && 
        !possibleName.match(/^\d+/)) { // Not starting with numbers
      console.log('⚠️ [ENHANCED NAME EXTRACTION] Utilisation adresse comme nom:', possibleName);
      return possibleName;
    }
  }

  // Priorité 4: Nom générique basé sur l'ID
  const fallbackName = `Bar ${place.id.slice(-8)}`;
  console.log('⚠️ [ENHANCED NAME EXTRACTION] Utilisation nom générique:', fallbackName);
  return fallbackName;
}

// Sélection AMÉLIORÉE avec validation multi-critères
function selectBestValidatedBar(bars: NewPlaceResult[]): NewPlaceResult {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  console.log('🔄 [ENHANCED FILTERING] Processing', bars.length, 'candidates');

  // Valider et noter tous les bars
  const validatedBars = bars
    .map(place => ({
      place,
      validation: EnhancedBarValidator.validateBarCandidate(place)
    }))
    .filter(item => item.validation.isValid)
    .sort((a, b) => b.validation.score - a.validation.score); // Sort by score descending

  console.log('✅ [ENHANCED FILTERING] Filtered to', validatedBars.length, 'valid bars');

  if (validatedBars.length === 0) {
    // Fallback: if no bars pass validation, use the first one with a warning
    console.warn('⚠️ [ENHANCED SELECTION] No bars passed validation, using first available with warning');
    return bars[0];
  }

  const selectedBar = validatedBars[0].place;
  console.log(`🎯 [ENHANCED SELECTION] Best validated bar selected:`, {
    name: selectedBar.displayName?.text || selectedBar.name,
    score: validatedBars[0].validation.score,
    primaryType: selectedBar.primaryType,
    rating: selectedBar.rating,
    businessStatus: selectedBar.businessStatus
  });
  
  return selectedBar;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, radius = 5000 } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 [ENHANCED BAR SEARCH] Recherche améliorée de bars près de:', { latitude, longitude, radius });
    
    // Utiliser la clé API depuis les secrets Supabase
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ [ENHANCED BAR SEARCH] Clé API Google Places manquante')
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Recherche Google Places API (New) v1 avec enrichissement des données
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 [ENHANCED BAR SEARCH] Recherche Google Places API (New) v1 avec validation améliorée');

    const requestBody = {
      includedTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: Math.max(radius, 15000) // Increased minimum radius for better results
        }
      },
      rankPreference: "DISTANCE",
      maxResultCount: 20,
      languageCode: "fr-FR"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.name,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.primaryType,places.types,places.businessStatus,places.currentOpeningHours'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    console.log('📊 [ENHANCED BAR SEARCH] Réponse Google Places API (New):', { 
      placeCount: data.places?.length,
      hasPlaces: !!data.places
    });

    if (!data.places || data.places.length === 0) {
      console.log('❌ [ENHANCED BAR SEARCH] Aucun bar trouvé par Google Places API (New)');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone',
          debug: {
            latitude,
            longitude,
            radius,
            enhancedSearchUsed: true
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [ENHANCED BAR SEARCH] Recherche avec validation multi-critères');
    console.log(`📋 [ENHANCED BAR SEARCH] ${data.places.length} bars trouvés par Google Places API`);

    // Sélection du MEILLEUR bar validé avec critères multiples
    const selectedBar = selectBestValidatedBar(data.places);
    
    // Extraction robuste du nom avec système de fallback amélioré
    const barName = extractBarName(selectedBar);
    const placeId = selectedBar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [ENHANCED DATA VALIDATION] Place ID invalide:', placeId);
      throw new Error('Place ID invalide reçu de l\'API');
    }
    
    // Validation finale du nom extrait
    if (!barName || barName.startsWith('places/') || barName.startsWith('ChIJ')) {
      console.error('❌ [ENHANCED DATA VALIDATION] Nom de bar invalide après extraction:', barName);
      console.error('   - Raw selectedBar:', JSON.stringify(selectedBar, null, 2));
      throw new Error('Impossible d\'extraire un nom de bar valide');
    }

    const result = {
      place_id: placeId,
      name: barName,
      formatted_address: selectedBar.formattedAddress || `Coordonnées: ${selectedBar.location.latitude.toFixed(4)}, ${selectedBar.location.longitude.toFixed(4)}`,
      geometry: {
        location: {
          lat: selectedBar.location.latitude,
          lng: selectedBar.location.longitude
        }
      },
      rating: selectedBar.rating,
      price_level: selectedBar.priceLevel,
      types: selectedBar.types || [],
      businessStatus: selectedBar.businessStatus,
      openNow: selectedBar.currentOpeningHours?.openNow,
      primaryType: selectedBar.primaryType
    };
    
    console.log('🍺 [ENHANCED BAR SEARCH] Bar sélectionné avec validation améliorée:', {
      extractedName: result.name,
      displayName: selectedBar.displayName?.text,
      originalName: selectedBar.name,
      address: result.formatted_address,
      rating: result.rating,
      businessStatus: result.businessStatus,
      openNow: result.openNow,
      primaryType: selectedBar.primaryType,
      types: selectedBar.types?.join(', ') || 'N/A',
      location: result.geometry.location,
      totalCandidates: data.places.length,
      enhancedValidation: true
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [ENHANCED BAR SEARCH] Erreur dans find-nearby-bars:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur lors de la recherche améliorée de bars',
        enhancedSearchUsed: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
