
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Coordonnées requises' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ Clé API manquante')
      return new Response(
        JSON.stringify({ error: 'Configuration manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Recherche simple de bars près de:', { latitude, longitude });

    // Simple search for bars within 5km
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub"],
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 5000
        }
      },
      maxResultCount: 10,
      languageCode: "fr-FR"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun bar trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Pick a random bar - true randomness!
    const randomBar = data.places[Math.floor(Math.random() * data.places.length)];
    
    const result = {
      place_id: randomBar.id,
      name: randomBar.displayName?.text || `Bar ${randomBar.id.slice(-8)}`,
      formatted_address: randomBar.formattedAddress || 'Adresse non disponible',
      geometry: {
        location: {
          lat: randomBar.location.latitude,
          lng: randomBar.location.longitude
        }
      }
    };

    console.log('🎲 Bar sélectionné aléatoirement:', result.name);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur de recherche' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
