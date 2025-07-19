
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface standardisée pour les réponses
interface StandardResponse {
  success: boolean;
  bar?: {
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
  };
  error?: string;
  debug?: any;
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

// Enhanced bar validation system
class EnhancedBarValidator {
  private static readonly NON_BAR_KEYWORDS = [
    'service', 'services', 'bureau', 'office', 'entreprise', 'company', 'société',
    'magasin', 'boutique', 'shop', 'store', 'pharmacie', 'pharmacy', 'clinique',
    'clinic', 'hôtel', 'hotel', 'restaurant', 'école', 'school', 'université',
    'banque', 'bank', 'assurance', 'insurance', 'immobilier', 'real estate',
    'garage', 'station', 'supermarché', 'supermarket', 'centre commercial',
    'shopping center', 'église', 'church', 'temple', 'mosquée', 'mosque',
    'medical', 'dental', 'hospital', 'market', 'mall', 'center', 'centre'
  ];

  private static readonly BAR_KEYWORDS = [
    'bar', 'pub', 'tavern', 'bistro', 'brasserie', 'lounge', 'cocktail',
    'wine bar', 'beer', 'drinks', 'alcohol', 'spirits', 'brewery'
  ];

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

    console.log('🔍 [AUTO-ASSIGN ENHANCED VALIDATION] Validating bar candidate:', {
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

    // Final validation with higher threshold for automatic assignment
    result.isValid = result.score >= 50; // Higher threshold for auto-assignment

    console.log('📊 [AUTO-ASSIGN ENHANCED VALIDATION] Validation result:', {
      name: displayName,
      score: result.score,
      isValid: result.isValid,
      reasons: result.reasons,
      warnings: result.warnings
    });

    return result;
  }
}

// Extraction ROBUSTE du nom du bar avec système de fallback
function extractBarName(place: NewPlaceResult): string {
  console.log('🔍 [AUTO-ASSIGN NAME EXTRACTION] Données complètes du bar:', JSON.stringify(place, null, 2));

  // Priorité 1: displayName.text (le plus fiable)
  if (place.displayName?.text && 
      !place.displayName.text.startsWith('places/') && 
      !place.displayName.text.startsWith('ChIJ') &&
      place.displayName.text.length > 2) {
    console.log('✅ [AUTO-ASSIGN NAME EXTRACTION] Utilisation displayName.text:', place.displayName.text);
    return place.displayName.text;
  }

  // Priorité 2: name (si ce n'est pas un Place ID)
  if (place.name && 
      !place.name.startsWith('places/') && 
      !place.name.startsWith('ChIJ') &&
      place.name.length > 2) {
    console.log('✅ [AUTO-ASSIGN NAME EXTRACTION] Utilisation name:', place.name);
    return place.name;
  }

  // Priorité 3: Fallback sur adresse formatée
  if (place.formattedAddress) {
    const addressParts = place.formattedAddress.split(',');
    const possibleName = addressParts[0].trim();
    if (possibleName && 
        possibleName.length > 2 && 
        !possibleName.match(/^\d+/)) {
      console.log('⚠️ [AUTO-ASSIGN NAME EXTRACTION] Utilisation adresse comme nom:', possibleName);
      return possibleName;
    }
  }

  // Priorité 4: Nom générique basé sur l'ID
  const fallbackName = `Bar ${place.id.slice(-8)}`;
  console.log('⚠️ [AUTO-ASSIGN NAME EXTRACTION] Utilisation nom générique:', fallbackName);
  return fallbackName;
}

// Sélection STRICTE avec validation renforcée pour l'auto-assignment
function selectBestValidatedBar(bars: NewPlaceResult[]): NewPlaceResult {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  console.log('🔄 [AUTO-ASSIGN ENHANCED FILTERING] Processing', bars.length, 'candidates with strict validation');

  // Valider et noter tous les bars avec seuil plus élevé
  const validatedBars = bars
    .map(place => ({
      place,
      validation: EnhancedBarValidator.validateBarCandidate(place)
    }))
    .filter(item => item.validation.isValid)
    .sort((a, b) => b.validation.score - a.validation.score);

  console.log('✅ [AUTO-ASSIGN ENHANCED FILTERING] Filtered to', validatedBars.length, 'strictly validated bars');

  if (validatedBars.length === 0) {
    throw new Error('Aucun bar n\'a passé la validation stricte pour l\'attribution automatique');
  }

  const selectedBar = validatedBars[0].place;
  console.log(`🎯 [AUTO-ASSIGN ENHANCED SELECTION] Best validated bar for auto-assignment:`, {
    name: selectedBar.displayName?.text || selectedBar.name,
    score: validatedBars[0].validation.score,
    primaryType: selectedBar.primaryType,
    rating: selectedBar.rating,
    businessStatus: selectedBar.businessStatus
  });
  
  return selectedBar;
}

// Validation stricte des coordonnées
function validateCoordinatesStrict(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { group_id, latitude, longitude } = await req.json()

    // Validation stricte des paramètres d'entrée
    if (!group_id) {
      const errorResponse: StandardResponse = {
        success: false,
        error: 'group_id est requis'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🤖 [AUTO-ASSIGN-BAR ENHANCED] Démarrage attribution améliorée pour groupe:', group_id);

    // Coordonnées avec fallback sécurisé sur Paris
    const searchLatitude = latitude && validateCoordinatesStrict(latitude, longitude) ? latitude : 48.8566;
    const searchLongitude = longitude && validateCoordinatesStrict(latitude, longitude) ? longitude : 2.3522;

    if (!validateCoordinatesStrict(searchLatitude, searchLongitude)) {
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Coordonnées invalides après validation'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📍 [AUTO-ASSIGN-BAR ENHANCED] Recherche avec coordonnées validées:', { 
      lat: searchLatitude, 
      lng: searchLongitude 
    });

    // Vérification de l'éligibilité du groupe AVANT la recherche
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, latitude, longitude, current_participants, status, bar_name, bar_place_id')
      .eq('id', group_id)
      .single();

    if (groupError || !group) {
      console.error('❌ [AUTO-ASSIGN-BAR ENHANCED] Groupe introuvable:', groupError);
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Groupe introuvable'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifications d'éligibilité STRICTES
    const isEligible = (
      group.current_participants === 5 &&
      group.status === 'confirmed' &&
      !group.bar_name &&
      !group.bar_place_id
    );

    if (!isEligible) {
      console.log('ℹ️ [AUTO-ASSIGN-BAR ENHANCED] Groupe non éligible:', {
        participants: group.current_participants,
        status: group.status,
        hasBar: !!group.bar_name,
        hasPlaceId: !!group.bar_place_id
      });
      
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Groupe non éligible pour attribution automatique'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recherche de bars authentiques avec Google Places
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ [AUTO-ASSIGN-BAR ENHANCED] Clé API Google Places manquante')
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Configuration API manquante'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recherche Google Places API (New) v1 avec validation améliorée
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 [AUTO-ASSIGN-BAR ENHANCED] Recherche Google Places API avec validation améliorée');

    const requestBody = {
      includedTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: searchLatitude,
            longitude: searchLongitude
          },
          radius: 15000 // Increased radius for better results
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

    const data: NewGooglePlacesResponse = await response.json();

    if (!data.places || data.places.length === 0) {
      console.log('❌ [AUTO-ASSIGN-BAR ENHANCED] Aucun bar trouvé par Google Places API');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun bar trouvé dans cette zone'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [AUTO-ASSIGN-BAR ENHANCED] Bars trouvés - validation stricte multi-critères');
    console.log(`📋 [AUTO-ASSIGN-BAR ENHANCED] ${data.places.length} bars trouvés par Google Places API`);

    // Sélection STRICTE du meilleur bar validé
    const selectedBar = selectBestValidatedBar(data.places);

    // Extraction robuste du nom avec système de fallback
    const barName = extractBarName(selectedBar);
    const placeId = selectedBar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [AUTO-ASSIGN ENHANCED DATA VALIDATION] Place ID invalide:', placeId);
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Place ID invalide reçu de l\'API'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validation finale du nom extrait
    if (!barName || barName.startsWith('places/') || barName.startsWith('ChIJ')) {
      console.error('❌ [AUTO-ASSIGN ENHANCED DATA VALIDATION] Nom de bar invalide après extraction:', barName);
      console.error('   - Raw selectedBar:', JSON.stringify(selectedBar, null, 2));
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Impossible d\'extraire un nom de bar valide'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Réponse standardisée avec validation améliorée
    const result: StandardResponse = {
      success: true,
      bar: {
        place_id: placeId,
        name: barName,
        formatted_address: selectedBar.formattedAddress || `Coordonnées: ${selectedBar.location.latitude.toFixed(4)}, ${selectedBar.location.longitude.toFixed(4)}`,
        geometry: {
          location: {
            lat: selectedBar.location.latitude,
            lng: selectedBar.location.longitude
          }
        },
        rating: selectedBar.rating
      }
    };

    console.log('✅ [AUTO-ASSIGN-BAR ENHANCED] Bar sélectionné avec validation stricte:', {
      extractedName: result.bar?.name,
      displayName: selectedBar.displayName?.text,
      originalName: selectedBar.name,
      businessStatus: selectedBar.businessStatus,
      primaryType: selectedBar.primaryType,
      openNow: selectedBar.currentOpeningHours?.openNow,
      types: selectedBar.types?.join(', ') || 'N/A',
      totalOptions: data.places.length,
      enhancedValidation: true
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [AUTO-ASSIGN-BAR ENHANCED] Erreur globale:', error);
    const errorResponse: StandardResponse = {
      success: false,
      error: 'Erreur serveur lors de l\'attribution automatique améliorée',
      debug: error.message
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
