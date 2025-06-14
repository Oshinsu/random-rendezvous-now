
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlaceResult {
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

    console.log('🔍 Recherche de bars près de:', { latitude, longitude, radius });
    console.log('📍 Position reçue - Lat:', latitude, 'Lng:', longitude);
    
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

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${latitude},${longitude}&` +
      `radius=${radius}&` +
      `type=bar&` +
      `key=${apiKey}`;

    console.log('🌐 URL de recherche Google Places:', url);

    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    console.log('📊 Réponse Google Places:', { status: data.status, resultCount: data.results?.length });

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('❌ Aucun bar trouvé:', data.status);
      console.log('🔍 Réponse complète Google Places:', JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({ error: 'Aucun bar trouvé dans cette zone', status: data.status }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Filtrer les bars avec une note correcte et prendre le mieux noté
    const goodBars = data.results
      .filter(bar => bar.rating && bar.rating >= 3.0) // Réduire le seuil à 3.0 pour plus de résultats
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const selectedBar = goodBars[0] || data.results[0];
    
    console.log('🍺 Bar sélectionné:', {
      name: selectedBar.name,
      address: selectedBar.formatted_address,
      rating: selectedBar.rating,
      location: selectedBar.geometry.location
    });

    return new Response(
      JSON.stringify(selectedBar),
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
