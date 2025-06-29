
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

// Types d'établissements à EXCLURE (pas des bars authentiques)
const EXCLUDED_TYPES = [
  'lodging', 'hotel', 'resort', 'guest_house', 'hostel',
  'restaurant', 'food', 'meal_takeaway', 'meal_delivery',
  'night_club', 'casino', 'store', 'shopping_mall', 'gas_station'
];

// Mots-clés suspects dans les noms (vape shops, etc.)
const SUSPICIOUS_KEYWORDS = [
  'vape', 'vapor', 'smoke', 'tobacco', 'cigarette', 'hotel', 'restaurant', 'resto'
];

// Fonction pour vérifier si un établissement est un bar authentique
function isAuthenticBar(place: PlaceResult): boolean {
  if (!place.types || place.types.length === 0) {
    console.log(`⚠️ [FILTER] ${place.name}: Aucun type défini`);
    return false;
  }

  // Vérifier s'il contient 'bar' dans ses types
  const hasBarType = place.types.includes('bar');
  
  // Vérifier s'il contient des types exclus
  const hasExcludedType = place.types.some(type => EXCLUDED_TYPES.includes(type));
  
  // Vérifier les mots-clés suspects dans le nom
  const hasSuspiciousName = SUSPICIOUS_KEYWORDS.some(keyword => 
    place.name.toLowerCase().includes(keyword.toLowerCase())
  );
  
  console.log(`🔍 [FILTER] ${place.name}: types=${place.types.join(', ')}, hasBar=${hasBarType}, hasExcluded=${hasExcludedType}, suspicious=${hasSuspiciousName}`);
  
  // Doit avoir 'bar' ET ne pas avoir de types exclus ET ne pas avoir de nom suspect
  return hasBarType && !hasExcludedType && !hasSuspiciousName;
}

// Fonction de sélection aléatoire
function selectRandomBar(bars: PlaceResult[]): PlaceResult {
  // Filtrer les bars avec une note décente (≥ 3.0) si disponible
  const decentBars = bars.filter(bar => !bar.rating || bar.rating >= 3.0);
  const barsToChooseFrom = decentBars.length > 0 ? decentBars : bars;
  
  // Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * barsToChooseFrom.length);
  return barsToChooseFrom[randomIndex];
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

    // Recherche Google Places avec type=bar
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=bar&key=${apiKey}`;
    
    console.log('🌐 Recherche Google Places (type=bar):', searchUrl.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(searchUrl);
    const data: GooglePlacesResponse = await response.json();

    console.log('📊 Réponse Google Places:', { 
      status: data.status, 
      resultCount: data.results?.length 
    });

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('❌ Aucun établissement trouvé par Google Places');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun établissement trouvé dans cette zone',
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

    // FILTRAGE STRICT : ne garder que les bars authentiques
    console.log('🔍 [FILTRAGE] Application du filtre strict pour bars authentiques...');
    const authenticBars = data.results.filter(isAuthenticBar);
    
    console.log(`📋 [FILTRAGE] Résultats après filtrage: ${authenticBars.length}/${data.results.length} bars authentiques`);

    if (authenticBars.length === 0) {
      console.log('❌ Aucun bar authentique trouvé après filtrage');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar authentique trouvé dans cette zone',
          debug: {
            totalFound: data.results.length,
            authenticBarsFound: authenticBars.length,
            excludedTypes: EXCLUDED_TYPES,
            suspiciousKeywords: SUSPICIOUS_KEYWORDS
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sélection ALÉATOIRE du bar authentique
    const selectedBar = selectRandomBar(authenticBars);
    
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
    
    console.log('🍺 Bar authentique sélectionné ALÉATOIREMENT:', {
      name: result.name,
      address: result.formatted_address,
      rating: result.rating,
      types: result.types,
      location: result.geometry.location,
      totalOptions: authenticBars.length
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
