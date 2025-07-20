
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage pour identifier les vrais bars/pubs avec support des brasseries
const isRealBarOrPub = (place: any): boolean => {
  const name = place.displayName?.text?.toLowerCase() || '';
  const address = place.formattedAddress?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType || '';
  const rating = place.rating || 0;

  console.log('🔍 Analyse du lieu:', {
    name: place.displayName?.text,
    types: types,
    primaryType: primaryType,
    rating: rating
  });

  // Filtrer les bars avec une note inférieure à 4
  if (rating > 0 && rating < 4.0) {
    console.log('❌ Lieu rejeté - note trop faible:', rating);
    return false;
  }

  // Mots-clés négatifs SANS "brasserie" - maintenant accepté
  const negativeKeywords = [
    'restaurant', 'café', 'pizzeria', 'bistrot', 'grill',
    'steakhouse', 'burger', 'sandwich', 'tacos', 'sushi', 'kebab',
    'crêperie', 'glacier', 'pâtisserie', 'boulangerie', 'fast food',
    'mcdo', 'kfc', 'subway', 'quick', 'domino', 'pizza hut',
    'hôtel', 'hotel', 'resort', 'auberge', 'gîte', 'camping',
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
    console.log('❌ Lieu rejeté - mot-clé négatif trouvé');
    return false;
  }

  // Types Google Places à éviter
  const negativeTypes = [
    'restaurant', 'meal_takeaway', 'meal_delivery', 'food',
    'cafe', 'bakery', 'grocery_or_supermarket', 'convenience_store',
    'gas_station', 'lodging', 'hospital', 'pharmacy', 'school',
    'university', 'church', 'mosque', 'synagogue', 'temple'
  ];

  // Vérifier si le type principal est négatif
  if (negativeTypes.includes(primaryType)) {
    console.log('❌ Lieu rejeté - type principal négatif:', primaryType);
    return false;
  }

  // Vérifier si trop de types négatifs sont présents
  const negativeTypesFound = types.filter((type: string) => negativeTypes.includes(type));
  if (negativeTypesFound.length > 1) {
    console.log('❌ Lieu rejeté - trop de types négatifs:', negativeTypesFound);
    return false;
  }

  // Types positifs pour les bars/pubs + brasseries
  const positiveTypes = ['bar', 'pub', 'liquor_store', 'night_club', 'establishment'];
  const hasPositiveType = types.some((type: string) => positiveTypes.includes(type)) || 
                         positiveTypes.includes(primaryType);

  // Accepter explicitement les brasseries
  const isBrasserie = name.includes('brasserie') || types.includes('brewery');
  
  if (!hasPositiveType && !isBrasserie) {
    console.log('⚠️ Lieu accepté par défaut - aucun type positif mais pas de négatif majeur');
  } else {
    console.log('✅ Lieu accepté - type positif trouvé ou brasserie');
  }

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

    console.log('🔍 Recherche avancée de bars près de:', { latitude, longitude });

    // Search for bars/pubs with extended radius (10km) and field mask for filtering
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub", "night_club"],
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 10000 // 10km radius
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
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.regularOpeningHours,places.types,places.primaryType,places.rating'
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

    console.log('📊 Lieux trouvés initialement:', data.places.length);

    // Filter only OPEN bars/pubs
    const openBars = data.places.filter(place => {
      const currentHours = place.currentOpeningHours;
      if (currentHours && currentHours.openNow !== undefined) {
        return currentHours.openNow === true;
      }
      return true; // If no current hours info, allow it
    });

    console.log('🕐 Lieux ouverts:', openBars.length);

    // Apply advanced filtering for real bars/pubs (includes rating filter)
    const realBars = openBars.filter(isRealBarOrPub);

    console.log('🍺 Vrais bars après filtrage:', realBars.length);

    // Fallback if no real bars found
    let selectedBars = realBars;
    if (realBars.length === 0) {
      console.log('⚠️ Aucun vrai bar trouvé, utilisation de tous les lieux ouverts');
      selectedBars = openBars;
    }

    if (selectedBars.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun bar ouvert trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Pick a random REAL bar - true randomness!
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
      },
      rating: randomBar.rating || null
    };

    console.log('🎲 Bar sélectionné aléatoirement:', result.name, '- Note:', result.rating);
    console.log('📊 Stats finales - Total:', data.places.length, 'Ouverts:', openBars.length, 'Vrais bars:', realBars.length);

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
