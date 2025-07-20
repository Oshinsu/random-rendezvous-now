
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage RENFORCÉE pour identifier les vrais bars/pubs (identique à simple-bar-search)
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { group_id, latitude, longitude } = await req.json()

    if (!group_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'group_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🤖 [AUTO-ASSIGN RENFORCÉ] Attribution pour:', group_id);

    // Vérifier l'éligibilité du groupe
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('current_participants, status, bar_name')
      .eq('id', group_id)
      .single();

    if (groupError || !group) {
      return new Response(
        JSON.stringify({ success: false, error: 'Groupe introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (group.current_participants !== 5 || group.status !== 'confirmed' || group.bar_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Groupe non éligible' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Coordonnées avec fallback
    const searchLatitude = latitude || 48.8566;
    const searchLongitude = longitude || 2.3522;

    // Recherche RENFORCÉE de bars avec rayon étendu
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Recherche RENFORCÉE de bars pour:', { searchLatitude, searchLongitude });

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub"],
      locationRestriction: {
        circle: {
          center: { latitude: searchLatitude, longitude: searchLongitude },
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
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun bar trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        JSON.stringify({ success: false, error: 'Aucun bar approprié trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sélection aléatoire parmi les bars FILTRÉS
    const randomBar = selectedBars[Math.floor(Math.random() * selectedBars.length)];
    
    const result = {
      success: true,
      bar: {
        place_id: randomBar.id,
        name: randomBar.displayName?.text || `Bar ${randomBar.id.slice(-8)}`,
        formatted_address: randomBar.formattedAddress || 'Adresse non disponible',
        geometry: {
          location: {
            lat: randomBar.location.latitude,
            lng: randomBar.location.longitude
          }
        }
      }
    };

    console.log('🎲 Bar sélectionné (filtrage renforcé):', result.bar.name);
    console.log('📊 Stats FINALES - Total:', data.places.length, 'Ouverts:', openBars.length, 'Bars purs:', pureBars.length, 'Sélectionnés:', selectedBars.length);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
