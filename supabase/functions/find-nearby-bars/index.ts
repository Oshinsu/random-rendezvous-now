
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewPlaceResult {
  id: string;
  name: string;
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

    console.log('🔍 Recherche de bars authentiques près de:', { latitude, longitude, radius });
    
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

// Recherche Google Places API (New) v1 avec filtrage strict
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 Recherche Google Places API (New) v1 avec filtrage strict pour bars authentiques');

    const requestBody = {
      includedPrimaryTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: radius
        }
      },
      rankPreference: "DISTANCE",
      maxResultCount: 20,
      languageCode: "fr"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.name,places.formattedAddress,places.location,places.rating,places.priceLevel,places.primaryType,places.types,places.businessStatus,places.currentOpeningHours'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    console.log('📊 Réponse Google Places API (New):', { 
      placeCount: data.places?.length,
      hasPlaces: !!data.places
    });

    if (!data.places || data.places.length === 0) {
      console.log('❌ Aucun établissement trouvé par Google Places API (New)');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun établissement trouvé dans cette zone',
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

    // PAS DE FILTRAGE - on accepte tous les bars trouvés par l'API Google
    console.log('✅ [SIMPLE APPROACH] Pas de filtrage - on accepte tous les bars de type "bar"');
    console.log(`📋 [SIMPLE APPROACH] ${data.places.length} bars trouvés par Google Places API`);

    // Sélection du PREMIER bar trouvé
    const selectedBar = selectFirstBar(data.places);
    
    // Gestion de l'adresse pour New API
    const barAddress = selectedBar.formattedAddress || `Coordonnées: ${selectedBar.location.latitude.toFixed(4)}, ${selectedBar.location.longitude.toFixed(4)}`;
    
    // Validation et correction du mapping des données
    const barName = selectedBar.name || `Bar ${selectedBar.id.slice(-8)}`;
    const placeId = selectedBar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [DATA VALIDATION] Place ID invalide:', placeId);
      throw new Error('Place ID invalide reçu de l\'API');
    }
    
    if (!barName || barName.startsWith('places/')) {
      console.error('❌ [DATA VALIDATION] Nom de bar invalide:', barName);
      console.error('   - Raw selectedBar:', JSON.stringify(selectedBar, null, 2));
      throw new Error('Nom de bar invalide - possiblement un Place ID');
    }

    const result = {
      place_id: placeId,
      name: barName,
      formatted_address: barAddress,
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
    
    console.log('🍺 Bar sélectionné avec approche simplifiée:', {
      name: result.name,
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
      JSON.stringify({ error: 'Erreur serveur lors de la recherche de bars authentiques' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
