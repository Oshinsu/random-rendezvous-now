
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
    business_status?: string;
  };
  error?: string;
  debug?: any;
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
  console.log('🔄 [AUTO-ASSIGN-FALLBACK] Recherche sans restriction openNow');
  
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
    console.error('❌ [AUTO-ASSIGN-FALLBACK] Erreur API:', fallbackResponse.status);
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

  console.log(`📋 [AUTO-ASSIGN-FALLBACK] Bars trouvés: ${transformedPlaces.length}`);
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
  
  console.log(`🎲 [AUTO-ASSIGN] Sélection parmi ${barsToChooseFrom.length} bars (${decentBars.length} avec bonne note, ${operationalBars.length} opérationnels)`);
  
  // Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * barsToChooseFrom.length);
  const selectedBar = barsToChooseFrom[randomIndex];
  
  console.log(`🎯 [AUTO-ASSIGN] Bar sélectionné: ${selectedBar.name} (index ${randomIndex}/${barsToChooseFrom.length - 1})`);
  
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

    console.log('🤖 [AUTO-ASSIGN-BAR] Démarrage attribution pour groupe:', group_id);

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

    console.log('📍 [AUTO-ASSIGN-BAR] Recherche avec coordonnées validées:', { 
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

    // Recherche de bars avec Google Places API v1
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

    // Recherche Google Places API v1 avec filtrage strict
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedPrimaryTypes: ["bar"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: searchLatitude,
            longitude: searchLongitude
          },
          radius: 8000
        }
      },
      strictTypeFiltering: true,
      openNow: true,
      includedTypes: ["bar"],
      excludedTypes: ["restaurant", "night_club", "lodging", "food", "meal_takeaway"]
    };
    
    console.log('🌐 [AUTO-ASSIGN-BAR] Recherche Google Places API v1 avec filtrage strict (bars ouverts uniquement)');

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
      console.error('❌ [AUTO-ASSIGN-BAR] Erreur API Google Places:', response.status);
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Erreur lors de la recherche'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data: GooglePlacesV1Response = await response.json();

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
      console.log('⚠️ [AUTO-ASSIGN-BAR] Aucun bar ouvert trouvé, tentative de fallback');
      availableBars = await searchWithFallback(searchLatitude, searchLongitude, 8000, apiKey);
    }

    if (availableBars.length === 0) {
      console.log('❌ [AUTO-ASSIGN-BAR] Aucun bar trouvé même avec fallback');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun bar trouvé dans cette zone'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sélection ALÉATOIRE du meilleur bar
    const selectedBar = selectRandomBar(availableBars);

    // Réponse standardisée
    const result: StandardResponse = {
      success: true,
      bar: {
        place_id: selectedBar.place_id,
        name: selectedBar.name,
        formatted_address: selectedBar.formatted_address || selectedBar.vicinity || `Coordonnées: ${selectedBar.geometry.location.lat.toFixed(4)}, ${selectedBar.geometry.location.lng.toFixed(4)}`,
        geometry: selectedBar.geometry,
        rating: selectedBar.rating,
        business_status: selectedBar.business_status
      }
    };

    console.log('✅ [AUTO-ASSIGN-BAR] Bar sélectionné ALÉATOIREMENT:', {
      name: result.bar?.name,
      business_status: result.bar?.business_status,
      totalOptions: availableBars.length
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [AUTO-ASSIGN-BAR] Erreur globale:', error);
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
