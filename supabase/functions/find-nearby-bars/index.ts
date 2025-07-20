
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

    console.log('🔍 [ENHANCED SEARCH] Recherche de bars près de:', { latitude, longitude, radius });
    
    // Utiliser la clé API depuis les secrets Supabase
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ Clé API Google Places manquante')
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enhanced cascading search with multiple strategies
    let selectedResult: { bar: NewPlaceResult; confidence: number; fallback?: string } | null = null;
    const searchStrategies = [
      { radius: Math.max(radius, 5000), types: ["bar", "pub"] },
      { radius: Math.max(radius * 1.5, 8000), types: ["bar", "pub"] },
      { radius: Math.max(radius * 2, 10000), types: ["bar", "pub", "night_club"] },
      { radius: Math.max(radius * 3, 15000), types: ["bar", "pub", "night_club"] }
    ];

    for (const strategy of searchStrategies) {
      console.log(`🔄 [ENHANCED CASCADING] Trying radius: ${strategy.radius}m, types: [${strategy.types.join(', ')}]`);

      const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
      const requestBody = {
        includedTypes: strategy.types,
        excludedTypes: ["restaurant", "cafe", "store", "supermarket", "hospital", "school", "gym"],
        locationRestriction: {
          circle: {
            center: {
              latitude: latitude,
              longitude: longitude
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
        console.log(`✅ [ENHANCED CASCADING] Found ${data.places.length} places with current strategy`);
        
        try {
          selectedResult = selectBestBar(data.places);
          if (selectedResult.confidence > 40) { // Lower threshold for manual selection
            console.log(`🎯 [ENHANCED CASCADING] Good confidence result found (${selectedResult.confidence.toFixed(1)})`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ [ENHANCED CASCADING] Strategy failed: ${error.message}`);
          continue;
        }
      }

      console.log(`❌ [ENHANCED CASCADING] Strategy failed, trying next...`);
    }

    if (!selectedResult) {
      console.log('❌ [ENHANCED SEARCH] Aucun bar trouvé après toutes les stratégies');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone malgré plusieurs tentatives',
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

    // Extraction robuste du nom avec système de fallback
    const barName = extractBarName(selectedResult.bar);
    const placeId = selectedResult.bar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [ENHANCED DATA VALIDATION] Place ID invalide:', placeId);
      throw new Error('Place ID invalide reçu de l\'API');
    }
    
    // Validation finale du nom extrait
    if (!barName || barName.startsWith('places/') || barName.startsWith('ChIJ')) {
      console.error('❌ [ENHANCED DATA VALIDATION] Nom de bar invalide après extraction:', barName);
      throw new Error('Impossible d\'extraire un nom de bar valide');
    }

    const result = {
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
      price_level: selectedResult.bar.priceLevel,
      types: selectedResult.bar.types || [],
      businessStatus: selectedResult.bar.businessStatus,
      openNow: selectedResult.bar.currentOpeningHours?.openNow,
      confidence_score: selectedResult.confidence,
      fallback_used: selectedResult.fallback,
      userRatingCount: selectedResult.bar.userRatingCount
    };
    
    console.log('🏆 [ENHANCED SEARCH] Bar sélectionné avec scoring avancé:', {
      extractedName: result.name,
      confidence: result.confidence_score,
      fallback: result.fallback_used,
      displayName: selectedResult.bar.displayName?.text,
      originalName: selectedResult.bar.name,
      address: result.formatted_address,
      rating: result.rating,
      businessStatus: result.businessStatus,
      openNow: result.openNow,
      primaryType: selectedResult.bar.primaryType,
      types: selectedResult.bar.types?.join(', ') || 'N/A',
      location: result.geometry.location,
      userRatingCount: result.userRatingCount
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [ENHANCED SEARCH] Erreur globale:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la recherche de bars' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
