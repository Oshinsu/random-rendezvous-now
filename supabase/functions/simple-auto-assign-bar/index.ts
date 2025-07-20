

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage pour identifier les vrais bars/pubs (identique à simple-bar-search)
const isRealBarOrPub = (place: any): boolean => {
  const name = place.displayName?.text?.toLowerCase() || '';
  const address = place.formattedAddress?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType || '';

  console.log('🔍 Analyse du lieu:', {
    name: place.displayName?.text,
    types: types,
    primaryType: primaryType
  });

  // Mots-clés négatifs - si trouvés, ce n'est probablement pas un vrai bar
  const negativeKeywords = [
    'restaurant', 'café', 'pizzeria', 'brasserie', 'bistrot', 'grill',
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

  // Types positifs pour les bars/pubs
  const positiveTypes = ['bar', 'pub', 'liquor_store', 'night_club', 'establishment'];
  const hasPositiveType = types.some((type: string) => positiveTypes.includes(type)) || 
                         positiveTypes.includes(primaryType);

  if (!hasPositiveType) {
    console.log('⚠️ Lieu accepté par défaut - aucun type positif mais pas de négatif majeur');
  } else {
    console.log('✅ Lieu accepté - type positif trouvé');
  }

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

    console.log('🤖 [AUTO-ASSIGN AVANCÉ] Attribution pour:', group_id);

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

    // Recherche avancée de bars
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Recherche avancée de bars pour:', { searchLatitude, searchLongitude });

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub"],
      locationRestriction: {
        circle: {
          center: { latitude: searchLatitude, longitude: searchLongitude },
          radius: 5000
        }
      },
      maxResultCount: 20, // Get more to filter properly
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

    // Apply advanced filtering for real bars/pubs
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
        JSON.stringify({ success: false, error: 'Aucun bar ouvert trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sélection aléatoire parmi les vrais bars
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

    console.log('🎲 Bar sélectionné:', result.bar.name);
    console.log('📊 Stats finales - Total:', data.places.length, 'Ouverts:', openBars.length, 'Vrais bars:', realBars.length);

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

