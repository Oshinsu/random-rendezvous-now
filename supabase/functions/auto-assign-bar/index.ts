
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { group_id, latitude, longitude } = await req.json()

    if (!group_id) {
      return new Response(
        JSON.stringify({ error: 'group_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🤖 Attribution automatique pour groupe:', group_id);

    // Utiliser les coordonnées fournies ou fallback sur Paris
    const searchLatitude = latitude || 48.8566;
    const searchLongitude = longitude || 2.3522;

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ Clé API Google Places manquante')
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recherche de bars
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLatitude},${searchLongitude}&radius=8000&type=bar&key=${apiKey}`;
    
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('⚠️ Aucun bar trouvé pour attribution automatique');
      return new Response(
        JSON.stringify({ error: 'Aucun bar trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filtrer et sélectionner le meilleur bar
    const filteredResults = data.results.filter(place => {
      const types = place.types || [];
      const name = place.name.toLowerCase();
      
      const excludedTypes = ['lodging', 'hotel', 'motel', 'resort'];
      const excludedWords = ['hotel', 'hôtel', 'motel', 'resort'];
      
      return !excludedTypes.some(type => types.includes(type)) &&
             !excludedWords.some(word => name.includes(word));
    });

    if (filteredResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun bar approprié trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const selectedBar = filteredResults
      .filter(bar => bar.rating && bar.rating >= 3.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || filteredResults[0];

    // Définir l'heure de rendez-vous (1h à partir de maintenant)
    const meetingTime = new Date(Date.now() + 1 * 60 * 60 * 1000);

    // Retourner les données du bar sélectionné
    const result = {
      place_id: selectedBar.place_id,
      name: selectedBar.name,
      formatted_address: selectedBar.formatted_address || selectedBar.vicinity || `Coordonnées: ${selectedBar.geometry.location.lat.toFixed(4)}, ${selectedBar.geometry.location.lng.toFixed(4)}`,
      geometry: selectedBar.geometry,
      rating: selectedBar.rating,
      meeting_time: meetingTime.toISOString()
    };

    console.log('✅ Bar sélectionné automatiquement:', result.name);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur dans auto-assign-bar:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de l\'attribution automatique' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
