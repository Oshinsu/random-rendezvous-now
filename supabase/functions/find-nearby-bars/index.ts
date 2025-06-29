
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
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
}

interface GooglePlacesV1Response {
  places: PlaceResult[];
}

// Fallback function for closed bars scenario
async function searchWithFallback(latitude: number, longitude: number, radius: number, apiKey: string): Promise<PlaceResult[]> {
  console.log('🔄 [FALLBACK] Recherche sans restriction openNow');
  
  const fallbackUrl = `https://places.googleapis.com/v1/places:searchNearby`;
  const fallbackBody = {
    includedPrimaryTypes: ["bar"],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: latitude,
          longitude: longitude
        },
        radius: radius
      }
    },
    strictTypeFiltering: true,
    includedTypes: ["bar"],
    excludedTypes: ["restaurant", "night_club", "lodging", "food", "meal_takeaway"]
  };

  const fallbackResponse = await fetch(fallbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.place_id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.types,places.businessStatus'
    },
    body: JSON.stringify(fallbackBody)
  });

  if (!fallbackResponse.ok) {
    console.error('❌ [FALLBACK] Erreur API:', fallbackResponse.status);
    return [];
  }

  const fallbackData: GooglePlacesV1Response = await fallbackResponse.json();
  
  // Transform to match our interface
  const transformedPlaces = (fallbackData.places || []).map(place => ({
    place_id: place.place_id,
    name: place.displayName?.text || place.name,
    formatted_address: place.formattedAddress,
    vicinity: place.vicinity,
    geometry: {
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0
      }
    },
    rating: place.rating,
    price_level: place.priceLevel,
    types: place.types,
    business_status: place.businessStatus
  }));

  console.log(`📋 [FALLBACK] Bars trouvés: ${transformedPlaces.length}`);
  return transformedPlaces;
}

// Fonction de sélection ALÉATOIRE améliorée
function selectRandomBar(bars: PlaceResult[]): PlaceResult {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  // Filtrer les bars opérationnels si disponible
  const operationalBars = bars.filter(bar => 
    !bar.business_status || bar.business_status === 'OPERATIONAL'
  );
  
  // Filtrer les bars avec une note décente (≥ 3.0) si disponible
  const barsToFilter = operationalBars.length > 0 ? operationalBars : bars;
  const decentBars = barsToFilter.filter(bar => !bar.rating || bar.rating >= 3.0);
  const barsToChooseFrom = decentBars.length > 0 ? decentBars : barsToFilter;
  
  console.log(`🎲 [SELECTION] Sélection parmi ${barsToChooseFrom.length} bars (${decentBars.length} avec bonne note, ${operationalBars.length} opérationnels)`);
  
  // Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * barsToChooseFrom.length);
  const selectedBar = barsToChooseFrom[randomIndex];
  
  console.log(`🎯 [SELECTION] Bar sélectionné: ${selectedBar.name} (index ${randomIndex}/${barsToChooseFrom.length - 1})`);
  
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

    console.log('🔍 Recherche de bars ouverts avec Google Places API v1:', { latitude, longitude, radius });
    
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

    // Recherche Google Places API v1 avec filtrage strict
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedPrimaryTypes: ["bar"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: radius
        }
      },
      strictTypeFiltering: true,
      openNow: true,
      includedTypes: ["bar"],
      excludedTypes: ["restaurant", "night_club", "lodging", "food", "meal_takeaway"]
    };
    
    console.log('🌐 Recherche Google Places API v1 avec filtrage strict (bars ouverts uniquement)');

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.place_id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.types,places.businessStatus'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('❌ Erreur API Google Places:', response.status);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la recherche' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data: GooglePlacesV1Response = await response.json();

    console.log('📊 Réponse Google Places API v1:', { 
      placesCount: data.places?.length || 0
    });

    // Transform to match our interface
    let availableBars = (data.places || []).map(place => ({
      place_id: place.place_id,
      name: place.displayName?.text || place.name,
      formatted_address: place.formattedAddress,
      vicinity: place.vicinity,
      geometry: {
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        }
      },
      rating: place.rating,
      price_level: place.priceLevel,
      types: place.types,
      business_status: place.businessStatus
    }));

    // Fallback si aucun bar ouvert trouvé
    if (availableBars.length === 0) {
      console.log('⚠️ Aucun bar ouvert trouvé, tentative de fallback');
      availableBars = await searchWithFallback(latitude, longitude, radius, apiKey);
    }

    if (availableBars.length === 0) {
      console.log('❌ Aucun bar trouvé même avec fallback');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone',
          debug: {
            latitude,
            longitude,
            radius
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sélection ALÉATOIRE du bar
    const selectedBar = selectRandomBar(availableBars);
    
    // Gestion de l'adresse
    const barAddress = selectedBar.formatted_address || selectedBar.vicinity || `Coordonnées: ${selectedBar.geometry.location.lat.toFixed(4)}, ${selectedBar.geometry.location.lng.toFixed(4)}`;
    
    const result = {
      place_id: selectedBar.place_id,
      name: selectedBar.name,
      formatted_address: barAddress,
      geometry: selectedBar.geometry,
      rating: selectedBar.rating,
      price_level: selectedBar.price_level,
      types: selectedBar.types || [],
      business_status: selectedBar.business_status
    };
    
    console.log('🍺 Bar sélectionné ALÉATOIREMENT:', {
      name: result.name,
      address: result.formatted_address,
      rating: result.rating,
      business_status: result.business_status,
      location: result.geometry.location,
      totalOptions: availableBars.length
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
