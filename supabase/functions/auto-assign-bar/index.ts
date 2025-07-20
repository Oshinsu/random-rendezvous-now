
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
    confidence_score?: number;
    fallback_used?: string;
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
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
  };
  userRatingCount?: number;
}

interface NewGooglePlacesResponse {
  places: NewPlaceResult[];
}

// Enhanced bar validation with strict checks
function isTrueBar(place: NewPlaceResult): boolean {
  console.log(`🔍 [BAR VALIDATION] Evaluating: ${place.displayName?.text || place.name}`);
  console.log(`   - primaryType: ${place.primaryType}`);
  console.log(`   - types: [${place.types?.join(', ') || 'N/A'}]`);
  console.log(`   - businessStatus: ${place.businessStatus}`);

  // 1. Check business status first
  if (place.businessStatus !== 'OPERATIONAL') {
    console.log(`❌ [BAR VALIDATION] Not operational: ${place.businessStatus}`);
    return false;
  }

  // 2. Primary type must be bar or pub
  const validPrimaryTypes = ['bar', 'pub', 'night_club'];
  if (!validPrimaryTypes.includes(place.primaryType || '')) {
    console.log(`❌ [BAR VALIDATION] Invalid primaryType: ${place.primaryType}`);
    return false;
  }

  // 3. Check types array for bar-related keywords
  const barKeywords = ['bar', 'pub', 'establishment', 'food', 'night_club', 'liquor_store'];
  const excludeKeywords = ['restaurant', 'cafe', 'store', 'gym', 'hospital', 'school'];
  
  const hasBarKeyword = place.types?.some(type => barKeywords.includes(type)) || false;
  const hasExcludedKeyword = place.types?.some(type => excludeKeywords.includes(type)) || false;

  if (!hasBarKeyword || hasExcludedKeyword) {
    console.log(`❌ [BAR VALIDATION] Type validation failed - hasBar: ${hasBarKeyword}, hasExcluded: ${hasExcludedKeyword}`);
    return false;
  }

  console.log(`✅ [BAR VALIDATION] Valid bar confirmed`);
  return true;
}

// Check if establishment is currently open
function isOpen(place: NewPlaceResult): boolean {
  if (!place.currentOpeningHours) {
    console.log(`⚠️ [OPENING HOURS] No opening hours data for ${place.displayName?.text || place.name}`);
    return true; // Assume open if no data
  }

  const openNow = place.currentOpeningHours.openNow;
  console.log(`🕐 [OPENING HOURS] ${place.displayName?.text || place.name} - Open now: ${openNow}`);
  
  return openNow !== false; // Consider open if undefined
}

// Calculate confidence score for bar selection
function calculateConfidenceScore(place: NewPlaceResult): number {
  let score = 0;
  
  // Base score for primary type (40 points max)
  switch (place.primaryType) {
    case 'bar':
      score += 40;
      break;
    case 'pub':
      score += 35;
      break;
    case 'night_club':
      score += 30;
      break;
    default:
      score += 10;
  }

  // Google rating bonus (30 points max)
  if (place.rating) {
    score += Math.min(30, place.rating * 6); // 5.0 rating = 30 points
  }

  // User rating count bonus (20 points max)
  if (place.userRatingCount) {
    score += Math.min(20, Math.log10(place.userRatingCount) * 5);
  }

  // Types array bonus (10 points max)
  const barTypes = ['bar', 'pub', 'establishment'];
  const typeMatches = place.types?.filter(type => barTypes.includes(type)).length || 0;
  score += Math.min(10, typeMatches * 3);

  console.log(`📊 [CONFIDENCE SCORE] ${place.displayName?.text || place.name}: ${score.toFixed(1)} points`);
  return score;
}

// Enhanced bar selection with confidence scoring
function selectBestBar(bars: NewPlaceResult[]): { bar: NewPlaceResult; confidence: number; fallback?: string } {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  console.log(`🎯 [BAR SELECTION] Analysing ${bars.length} candidates`);

  // Filter true bars first
  const trueBars = bars.filter(isTrueBar);
  console.log(`📋 [BAR SELECTION] ${trueBars.length} true bars found`);

  // Filter open bars
  const openBars = trueBars.filter(isOpen);
  console.log(`🕐 [BAR SELECTION] ${openBars.length} open bars found`);

  let candidateBars = openBars.length > 0 ? openBars : trueBars;
  let fallback: string | undefined;

  if (openBars.length === 0 && trueBars.length > 0) {
    fallback = 'Heures d\'ouverture non vérifiées';
    console.log(`⚠️ [BAR SELECTION] Using fallback - no confirmed open bars`);
  }

  if (candidateBars.length === 0) {
    // Emergency fallback - use all bars
    candidateBars = bars;
    fallback = 'Critères assouplis - vérifiez les informations';
    console.log(`🆘 [BAR SELECTION] Emergency fallback - using all candidates`);
  }

  // Calculate confidence scores and sort
  const scoredBars = candidateBars.map(bar => ({
    bar,
    confidence: calculateConfidenceScore(bar)
  })).sort((a, b) => b.confidence - a.confidence);

  const selected = scoredBars[0];
  
  console.log(`🏆 [BAR SELECTION] Selected: ${selected.bar.displayName?.text || selected.bar.name} (Score: ${selected.confidence.toFixed(1)})`);

  return {
    bar: selected.bar,
    confidence: selected.confidence,
    fallback
  };
}

// Extraction ROBUSTE du nom du bar avec système de fallback
function extractBarName(place: NewPlaceResult): string {
  console.log('🔍 [NAME EXTRACTION] Données complètes du bar:', JSON.stringify(place, null, 2));

  // Priorité 1: displayName.text (le plus fiable)
  if (place.displayName?.text && !place.displayName.text.startsWith('places/') && !place.displayName.text.startsWith('ChIJ')) {
    console.log('✅ [NAME EXTRACTION] Utilisation displayName.text:', place.displayName.text);
    return place.displayName.text;
  }

  // Priorité 2: name (si ce n'est pas un Place ID)
  if (place.name && !place.name.startsWith('places/') && !place.name.startsWith('ChIJ')) {
    console.log('✅ [NAME EXTRACTION] Utilisation name:', place.name);
    return place.name;
  }

  // Priorité 3: Fallback sur adresse formatée
  if (place.formattedAddress) {
    const addressParts = place.formattedAddress.split(',');
    const possibleName = addressParts[0].trim();
    if (possibleName && possibleName.length > 2) {
      console.log('⚠️ [NAME EXTRACTION] Utilisation adresse comme nom:', possibleName);
      return possibleName;
    }
  }

  // Priorité 4: Nom générique basé sur l'ID
  const fallbackName = `Bar ${place.id.slice(-8)}`;
  console.log('⚠️ [NAME EXTRACTION] Utilisation nom générique:', fallbackName);
  return fallbackName;
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

    console.log('🤖 [AUTO-ASSIGN-BAR] Démarrage attribution ENHANCED pour groupe:', group_id);

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

    console.log('📍 [AUTO-ASSIGN-BAR] Recherche ENHANCED avec coordonnées validées:', { 
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
      console.error('❌ [AUTO-ASSIGN-BAR] Groupe introuvable:', groupError);
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
      console.log('ℹ️ [AUTO-ASSIGN-BAR] Groupe non éligible:', {
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

    // Recherche ENHANCED avec Google Places
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ [AUTO-ASSIGN-BAR] Clé API Google Places manquante')
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Configuration API manquante'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Enhanced API request with multiple fallback strategies
    let selectedResult: { bar: NewPlaceResult; confidence: number; fallback?: string } | null = null;
    const searchStrategies = [
      { radius: 5000, types: ["bar", "pub"] },
      { radius: 8000, types: ["bar", "pub"] },
      { radius: 10000, types: ["bar", "pub", "night_club"] },
      { radius: 15000, types: ["bar", "pub", "night_club"] }
    ];

    for (const strategy of searchStrategies) {
      console.log(`🔄 [CASCADING SEARCH] Trying radius: ${strategy.radius}m, types: [${strategy.types.join(', ')}]`);

      const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
      const requestBody = {
        includedTypes: strategy.types,
        excludedTypes: ["restaurant", "cafe", "store", "supermarket", "hospital", "school", "gym"],
        locationRestriction: {
          circle: {
            center: {
              latitude: searchLatitude,
              longitude: searchLongitude
            },
            radius: strategy.radius
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
          'X-Goog-FieldMask': 'places.id,places.name,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.primaryType,places.types,places.businessStatus,places.currentOpeningHours,places.userRatingCount'
        },
        body: JSON.stringify(requestBody)
      });

      const data: NewGooglePlacesResponse = await response.json();

      if (data.places && data.places.length > 0) {
        console.log(`✅ [CASCADING SEARCH] Found ${data.places.length} places with current strategy`);
        
        try {
          selectedResult = selectBestBar(data.places);
          if (selectedResult.confidence > 50) { // Minimum confidence threshold
            console.log(`🎯 [CASCADING SEARCH] High confidence result found (${selectedResult.confidence.toFixed(1)})`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ [CASCADING SEARCH] Strategy failed: ${error.message}`);
          continue;
        }
      }

      console.log(`❌ [CASCADING SEARCH] Strategy failed, trying next...`);
    }

    if (!selectedResult) {
      console.log('❌ [AUTO-ASSIGN-BAR] Aucun bar trouvé après toutes les stratégies');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun bar trouvé dans cette zone malgré plusieurs tentatives'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extraction robuste du nom avec système de fallback
    const barName = extractBarName(selectedResult.bar);
    const placeId = selectedResult.bar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [AUTO-ASSIGN DATA VALIDATION] Place ID invalide:', placeId);
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
      console.error('❌ [AUTO-ASSIGN DATA VALIDATION] Nom de bar invalide après extraction:', barName);
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Impossible d\'extraire un nom de bar valide'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Réponse standardisée avec scoring et fallback info
    const result: StandardResponse = {
      success: true,
      bar: {
        place_id: placeId,
        name: barName,
        formatted_address: selectedResult.bar.formattedAddress || `Coordonnées: ${selectedResult.bar.location.latitude.toFixed(4)}, ${selectedResult.bar.location.longitude.toFixed(4)}`,
        geometry: {
          location: {
            lat: selectedResult.bar.location.latitude,
            lng: selectedResult.bar.location.longitude
          }
        },
        rating: selectedResult.bar.rating,
        confidence_score: selectedResult.confidence,
        fallback_used: selectedResult.fallback
      }
    };

    console.log('🏆 [AUTO-ASSIGN-BAR] ENHANCED bar selection completed:', {
      name: result.bar?.name,
      confidence: result.bar?.confidence_score,
      fallback: result.bar?.fallback_used,
      primaryType: selectedResult.bar.primaryType,
      businessStatus: selectedResult.bar.businessStatus,
      openNow: selectedResult.bar.currentOpeningHours?.openNow,
      rating: selectedResult.bar.rating,
      userRatingCount: selectedResult.bar.userRatingCount
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [AUTO-ASSIGN-BAR] Erreur globale ENHANCED:', error);
    const errorResponse: StandardResponse = {
      success: false,
      error: 'Erreur serveur lors de l\'attribution automatique',
      debug: error.message
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
