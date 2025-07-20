
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage STRICTE pour les bars/pubs/brasseries UNIQUEMENT
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

  // NOUVELLE RÈGLE : Seuil de note abaissé à 3.0 (au lieu de 4.0)
  if (rating > 0 && rating < 3.0) {
    console.log('❌ Lieu rejeté - note trop faible:', rating);
    return false;
  }

  // 1. PRIORITÉ ABSOLUE : Vrais bars et pubs
  const isBarOrPub = types.includes('bar') || types.includes('pub') || 
                     primaryType === 'bar' || primaryType === 'pub';
  
  // 2. BRASSERIES acceptées explicitement
  const isBrasserie = name.includes('brasserie') || types.includes('brewery') || 
                      name.includes('brewery');
  
  // 3. Bars dans des restaurants acceptés SI pas trop de types restaurant
  const hasBarType = types.includes('bar');
  const restaurantTypes = types.filter(type => ['restaurant', 'meal_takeaway', 'food'].includes(type));
  const isRestaurantBar = hasBarType && restaurantTypes.length <= 2;

  if (isBarOrPub) {
    console.log('✅ PRIORITÉ 1 - Vrai bar/pub détecté');
    return true;
  }
  
  if (isBrasserie) {
    console.log('✅ PRIORITÉ 2 - Brasserie acceptée');
    return true;
  }
  
  if (isRestaurantBar) {
    console.log('✅ PRIORITÉ 3 - Restaurant-bar accepté (types restaurants limités)');
    return true;
  }

  // Types explicitement INTERDITS
  const bannedTypes = [
    'cafe', 'bakery', 'grocery_or_supermarket', 'convenience_store',
    'gas_station', 'lodging', 'hospital', 'pharmacy', 'school',
    'university', 'church', 'mosque', 'synagogue', 'temple',
    'hotel'
  ];

  const hasBannedType = bannedTypes.some(type => types.includes(type)) || 
                        bannedTypes.includes(primaryType);
  
  if (hasBannedType) {
    console.log('❌ Lieu rejeté - type interdit détecté');
    return false;
  }

  // Mots-clés strictement INTERDITS
  const bannedKeywords = [
    'mcdo', 'kfc', 'subway', 'quick', 'domino', 'pizza hut',
    'hôtel', 'hotel', 'resort', 'camping', 'supermarché', 'épicerie',
    'magasin', 'pharmacie', 'école', 'hôpital', 'église', 'temple'
  ];

  const hasBannedKeyword = bannedKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  );

  if (hasBannedKeyword) {
    console.log('❌ Lieu rejeté - mot-clé interdit trouvé');
    return false;
  }

  console.log('❌ Lieu rejeté - ne correspond à aucun critère de bar/pub/brasserie');
  return false;
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
      .single()

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

    console.log('🔍 Recherche avancée avec rayon 10km pour:', { searchLatitude, searchLongitude });

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub", "brewery"], // SUPPRIMÉ "night_club", AJOUTÉ "brewery"
      locationRestriction: {
        circle: {
          center: { latitude: searchLatitude, longitude: searchLongitude },
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

    // Filtrage STRICT pour les bars/pubs/brasseries UNIQUEMENT
    const realBars = openBars.filter(isRealBarOrPub);

    console.log('🍺 Vrais bars après filtrage STRICT:', realBars.length);

    // AUCUN FALLBACK ! Si pas de bars trouvés = ERREUR
    if (realBars.length === 0) {
      console.log('❌ ÉCHEC - Aucun bar/pub/brasserie trouvé dans la zone');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun bar, pub ou brasserie trouvé dans cette zone. Essayez de changer de localisation.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sélection aléatoire parmi les VRAIS bars uniquement
    const randomBar = realBars[Math.floor(Math.random() * realBars.length)];
    
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
        },
        rating: randomBar.rating || null
      }
    };

    console.log('🎲 Bar sélectionné:', result.bar.name, '- Note:', result.bar.rating);
    console.log('📊 RÉSULTATS FINAUX - Total trouvés:', data.places.length, 'Ouverts:', openBars.length, 'BARS VALIDES:', realBars.length);

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
