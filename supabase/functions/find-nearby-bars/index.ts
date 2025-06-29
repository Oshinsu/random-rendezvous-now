
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
}

interface GooglePlacesResponse {
  results: PlaceResult[];
  status: string;
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

    console.log('🔍 Recherche simplifiée de bars près de:', { latitude, longitude, radius });
    
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

    // RECHERCHE SIMPLIFIÉE: uniquement type=bar
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=bar&key=${apiKey}`;
    
    console.log('🌐 Recherche Google Places (type=bar uniquement):', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(searchUrl);
    const data: GooglePlacesResponse = await response.json();

    console.log('📊 Réponse Google Places:', { 
      status: data.status, 
      resultCount: data.results?.length 
    });

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('❌ Aucun bar trouvé par Google Places');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone',
          debug: {
            latitude,
            longitude,
            radius,
            apiStatus: data.status
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sélection simple : prendre le mieux noté ou le premier
    const sortedBars = data.results
      .filter(bar => bar.rating && bar.rating >= 3.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const selectedBar = sortedBars[0] || data.results[0];
    
    // Gestion de l'adresse
    const barAddress = selectedBar.formatted_address || selectedBar.vicinity || `Coordonnées: ${selectedBar.geometry.location.lat.toFixed(4)}, ${selectedBar.geometry.location.lng.toFixed(4)}`;
    
    const result = {
      place_id: selectedBar.place_id,
      name: selectedBar.name,
      formatted_address: barAddress,
      geometry: selectedBar.geometry,
      rating: selectedBar.rating,
      price_level: selectedBar.price_level,
      types: selectedBar.types || []
    };
    
    console.log('🍺 Bar sélectionné (recherche simplifiée):', {
      name: result.name,
      address: result.formatted_address,
      rating: result.rating,
      types: result.types,
      location: result.geometry.location
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
