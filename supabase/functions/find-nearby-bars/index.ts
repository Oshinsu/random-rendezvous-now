
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

    // CORRECTION: Recherche spécifique aux bars avec mots-clés multiples
    const searchQueries = [
      // Recherche principale avec type bar
      `location=${latitude},${longitude}&radius=${radius}&type=bar&key=${apiKey}`,
      // Recherche avec mots-clés spécifiques
      `location=${latitude},${longitude}&radius=${radius}&keyword=bar pub taverne&type=establishment&key=${apiKey}`,
      // Recherche avec place type night_club pour diversifier
      `location=${latitude},${longitude}&radius=${radius}&type=night_club&key=${apiKey}`
    ];

    let allBars: PlaceResult[] = [];

    // Effectuer plusieurs recherches pour maximiser les résultats de bars
    for (let i = 0; i < searchQueries.length; i++) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchQueries[i]}`;
        console.log(`🌐 Recherche ${i + 1}/3:`, url.replace(apiKey, 'API_KEY_HIDDEN'));

        const response = await fetch(url);
        const data: GooglePlacesResponse = await response.json();

        console.log(`📊 Réponse recherche ${i + 1}:`, { status: data.status, resultCount: data.results?.length });

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          // Filtrer strictement pour exclure les hôtels
          const filteredResults = data.results.filter(place => {
            const types = place.types || [];
            const name = place.name.toLowerCase();
            
            // Exclure explicitement les hôtels, lodging, et autres hébergements
            const excludedTypes = ['lodging', 'hotel', 'motel', 'resort', 'hostel', 'guest_house'];
            const hasExcludedType = excludedTypes.some(excludedType => 
              types.includes(excludedType)
            );
            
            // Exclure les noms contenant des mots d'hôtellerie
            const excludedWords = ['hotel', 'hôtel', 'motel', 'resort', 'auberge', 'lodge', 'inn'];
            const hasExcludedWord = excludedWords.some(word => 
              name.includes(word)
            );
            
            // Privilégier les types liés aux bars
            const barTypes = ['bar', 'pub', 'tavern', 'brewery', 'wine_bar', 'cocktail_lounge', 'night_club'];
            const hasBarType = barTypes.some(barType => 
              types.includes(barType) || name.includes(barType)
            );
            
            const isValid = !hasExcludedType && !hasExcludedWord;
            
            if (!isValid) {
              console.log(`❌ Exclu: ${place.name} (types: ${types.join(', ')}, motifs: ${hasExcludedType ? 'type exclu' : 'mot exclu'})`);
            } else {
              console.log(`✅ Accepté: ${place.name} (types: ${types.join(', ')}, hasBarType: ${hasBarType})`);
            }
            
            return isValid;
          });
          
          allBars = [...allBars, ...filteredResults];
        }
      } catch (error) {
        console.error(`❌ Erreur recherche ${i + 1}:`, error);
      }
    }

    // Supprimer les doublons basés sur place_id
    const uniqueBars = allBars.filter((bar, index, self) => 
      index === self.findIndex(b => b.place_id === bar.place_id)
    );

    console.log(`📊 Total des bars trouvés après filtrage: ${uniqueBars.length}`);

    if (uniqueBars.length === 0) {
      console.error('❌ Aucun bar trouvé après filtrage strict');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone',
          debug: {
            latitude,
            longitude,
            radius,
            totalSearches: searchQueries.length,
            rawResults: allBars.length,
            filteredResults: uniqueBars.length
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Trier par note et sélectionner le meilleur
    const sortedBars = uniqueBars
      .filter(bar => bar.rating && bar.rating >= 3.0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const selectedBar = sortedBars[0] || uniqueBars[0];
    
    // Améliorer la gestion de l'adresse
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
    
    console.log('🍺 Bar final sélectionné:', {
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
