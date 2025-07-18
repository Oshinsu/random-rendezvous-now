
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

// Sélection SIMPLE du premier bar - pas de filtrage complexe
function selectFirstBar(bars: NewPlaceResult[]): NewPlaceResult {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  const selectedBar = bars[0];
  console.log(`🎯 [SIMPLE SELECTION] Premier bar sélectionné: ${selectedBar.name}`);
  
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

    console.log('🔍 Recherche de bars près de:', { latitude, longitude, radius });
    
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

    // Recherche Google Places API (New) v1 avec enrichissement des données
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 Recherche Google Places API (New) v1 avec enrichissement des données');

    const requestBody = {
      includedTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: Math.max(radius, 10000) // Minimum 10km radius
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

    console.log('📊 Réponse Google Places API (New):', { 
      placeCount: data.places?.length,
      hasPlaces: !!data.places
    });

    if (!data.places || data.places.length === 0) {
      console.log('❌ Aucun bar trouvé par Google Places API (New)');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone',
          debug: {
            latitude,
            longitude,
            radius,
            newApiUsed: true
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ [SIMPLE APPROACH] Recherche exclusivement sur type "bar"');
    console.log(`📋 [SIMPLE APPROACH] ${data.places.length} bars trouvés par Google Places API`);

    // Sélection du PREMIER bar trouvé
    const selectedBar = selectFirstBar(data.places);
    
    // Extraction robuste du nom avec système de fallback
    const barName = extractBarName(selectedBar);
    const placeId = selectedBar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [DATA VALIDATION] Place ID invalide:', placeId);
      throw new Error('Place ID invalide reçu de l\'API');
    }
    
    // Validation finale du nom extrait
    if (!barName || barName.startsWith('places/') || barName.startsWith('ChIJ')) {
      console.error('❌ [DATA VALIDATION] Nom de bar invalide après extraction:', barName);
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
      openNow: selectedBar.currentOpeningHours?.openNow
    };
    
    console.log('🍺 Bar sélectionné avec extraction robuste du nom:', {
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
      totalOptions: data.places.length
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans find-nearby-bars:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la recherche de bars' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
