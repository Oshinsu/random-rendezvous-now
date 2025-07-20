
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage RENFORCÉE pour identifier les vrais bars/pubs
const isRealBarOrPub = (place: any): boolean => {
  const name = place.displayName?.text?.toLowerCase() || '';
  const address = place.formattedAddress?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType || '';

  console.log('🔍 Analyse RENFORCÉE du lieu:', {
    name: place.displayName?.text,
    types: types,
    primaryType: primaryType,
    address: place.formattedAddress
  });

  // Mots-clés négatifs ÉTENDUS - incluant les établissements mixtes
  const negativeKeywords = [
    'restaurant', 'café', 'pizzeria', 'brasserie', 'bistrot', 'grill',
    'steakhouse', 'burger', 'sandwich', 'tacos', 'sushi', 'kebab',
    'crêperie', 'glacier', 'pâtisserie', 'boulangerie', 'fast food',
    'mcdo', 'kfc', 'subway', 'quick', 'domino', 'pizza hut',
    'hôtel', 'hotel', 'resort', 'auberge', 'gîte', 'camping',
    'villa', 'resort', 'spa', 'wellness', 'relax', 'détente',
    'supermarché', 'épicerie', 'magasin', 'boutique', 'pharmacie',
    'station service', 'essence', 'garage', 'centre commercial',
    'école', 'université', 'hôpital', 'clinique', 'mairie',
    'église', 'temple', 'mosquée', 'synagogue'
  ];

  // Vérifier les mots-clés négatifs dans le nom et l'adresse
  const hasNegativeKeyword = negativeKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  );

  if (hasNegativeKeyword) {
    console.log('❌ Lieu rejeté - mot-clé négatif trouvé:', negativeKeywords.find(k => name.includes(k) || address.includes(k)));
    return false;
  }

  // Types Google Places à éviter - LISTE ÉTENDUE
  const negativeTypes = [
    'restaurant', 'meal_takeaway', 'meal_delivery', 'food',
    'cafe', 'bakery', 'grocery_or_supermarket', 'convenience_store',
    'gas_station', 'lodging', 'hospital', 'pharmacy', 'school',
    'university', 'church', 'mosque', 'synagogue', 'temple',
    'hotel', 'spa', 'resort'
  ];

  // RÈGLE STRICTE: Rejeter si type principal est négatif
  if (negativeTypes.includes(primaryType)) {
    console.log('❌ Lieu rejeté - type principal négatif:', primaryType);
    return false;
  }

  // RÈGLE STRICTE: Rejeter les établissements mixtes bar+restaurant
  const hasBarType = types.includes('bar');
  const hasRestaurantType = types.includes('restaurant') || types.includes('food');
  
  if (hasBarType && hasRestaurantType) {
    console.log('❌ Lieu rejeté - établissement mixte bar+restaurant détecté');
    return false;
  }

  // RÈGLE STRICTE: Rejeter si trop de types négatifs sont présents
  const negativeTypesFound = types.filter((type: string) => negativeTypes.includes(type));
  if (negativeTypesFound.length > 0) {
    console.log('❌ Lieu rejeté - types négatifs trouvés:', negativeTypesFound);
    return false;
  }

  // Types positifs STRICTS pour les bars/pubs PURS
  const strictPositiveTypes = ['bar', 'pub', 'liquor_store', 'night_club'];
  const hasStrictPositiveType = types.some((type: string) => strictPositiveTypes.includes(type)) || 
                               strictPositiveTypes.includes(primaryType);

  if (!hasStrictPositiveType) {
    console.log('❌ Lieu rejeté - aucun type strict positif trouvé');
    return false;
  }

  // VÉRIFICATION FINALE: Privilégier les bars/pubs purs
  if (primaryType === 'bar' || primaryType === 'pub') {
    console.log('✅ Lieu accepté - bar/pub pur avec type principal:', primaryType);
    return true;
  }

  console.log('⚠️ Lieu accepté avec réserve - type principal:', primaryType);
  return true;
};

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

    console.log('🔍 Recherche RENFORCÉE de bars près de:', { latitude, longitude });

    // Search for bars/pubs with EXTENDED RADIUS (10km)
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub"],
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 10000 // AUGMENTÉ à 10km
        }
      },
      maxResultCount: 20,
      languageCode: "fr-FR"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.regularOpeningHours,places.types,places.primaryType'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      console.log('❌ Aucun lieu trouvé avec le rayon étendu');
      return new Response(
        JSON.stringify({ error: 'Aucun bar trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📊 Lieux trouvés avec rayon 10km:', data.places.length);

    // Filter only OPEN bars/pubs
    const openBars = data.places.filter(place => {
      const currentHours = place.currentOpeningHours;
      if (currentHours && currentHours.openNow !== undefined) {
        return currentHours.openNow === true;
      }
      return true; // If no current hours info, allow it
    });

    console.log('🕐 Lieux ouverts:', openBars.length);

    // Apply REINFORCED filtering for PURE bars/pubs
    const pureBars = openBars.filter(isRealBarOrPub);

    console.log('🍺 Bars PURS après filtrage renforcé:', pureBars.length);

    // STRICT fallback - prefer pure bars, but allow open bars if none
    let selectedBars = pureBars;
    if (pureBars.length === 0) {
      console.log('⚠️ Aucun bar pur trouvé, fallback vers lieux ouverts');
      // Apply lighter filtering for fallback
      selectedBars = openBars.filter(place => {
        const types = place.types || [];
        const hasBar = types.includes('bar') || types.includes('pub');
        const hasRestaurant = types.includes('restaurant');
        // At least require bar/pub type and avoid pure restaurants
        return hasBar && !hasRestaurant;
      });
    }

    if (selectedBars.length === 0) {
      console.log('❌ Aucun bar approprié trouvé même avec fallback');
      return new Response(
        JSON.stringify({ error: 'Aucun bar approprié trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Pick a random bar from the FILTERED selection
    const randomBar = selectedBars[Math.floor(Math.random() * selectedBars.length)];
    
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

    console.log('🎲 Bar sélectionné (filtrage renforcé):', result.name);
    console.log('📊 Stats FINALES - Total:', data.places.length, 'Ouverts:', openBars.length, 'Bars purs:', pureBars.length, 'Sélectionnés:', selectedBars.length);

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
