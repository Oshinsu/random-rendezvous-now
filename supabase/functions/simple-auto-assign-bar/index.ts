
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage AMÉLIORÉE identique à simple-bar-search
const isRealBarOrPub = (place: any): boolean => {
  const name = place.displayName?.text?.toLowerCase() || '';
  const address = place.formattedAddress?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType || '';

  console.log('🔍 [FILTRAGE AVANCÉ] Analyse du lieu:', {
    name: place.displayName?.text,
    types: types,
    primaryType: primaryType,
    address: place.formattedAddress
  });

  // ÉTAPE 1: Mots-clés TRÈS négatifs - exclusion immédiate
  const criticalNegativeKeywords = [
    'moto', 'motorcycle', 'harley', 'yamaha', 'honda', 'kawasaki', 'suzuki',
    'concessionnaire', 'dealer', 'garage moto', 'bike shop',
    'école', 'university', 'hôpital', 'clinique', 'mairie', 'préfecture',
    'église', 'temple', 'mosquée', 'synagogue', 'cathédrale',
    'pharmacie', 'station service', 'essence', 'total', 'shell',
    'supermarché', 'carrefour', 'leclerc', 'champion', 'géant',
    'magasin', 'boutique', 'centre commercial', 'mall'
  ];

  const hasCriticalNegative = criticalNegativeKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  );

  if (hasCriticalNegative) {
    console.log('❌ [FILTRAGE] Lieu REJETÉ - mot-clé critique trouvé');
    return false;
  }

  // ÉTAPE 2: Vérification des mots-clés POSITIFS prioritaires
  const highPriorityKeywords = ['bar', 'pub', 'brasserie', 'taverne', 'lounge'];
  const hasHighPriorityKeyword = highPriorityKeywords.some(keyword => name.includes(keyword));

  if (hasHighPriorityKeyword) {
    console.log('✅ [FILTRAGE] Lieu ACCEPTÉ - mot-clé prioritaire trouvé:', name);
    return true;
  }

  // ÉTAPE 3: Types Google Places - vérification flexible
  const acceptableTypes = [
    'bar', 'pub', 'establishment', 'night_club', 'liquor_store'
  ];

  const hasAcceptableType = types.some((type: string) => acceptableTypes.includes(type)) || 
                           acceptableTypes.includes(primaryType);

  // ÉTAPE 4: Gestion spéciale des bar-restaurants
  const isBarRestaurant = (types.includes('bar') && types.includes('restaurant')) ||
                         (primaryType === 'bar' && types.includes('restaurant')) ||
                         (primaryType === 'restaurant' && types.includes('bar'));

  if (isBarRestaurant) {
    console.log('🍽️ [FILTRAGE] Bar-restaurant détecté - ACCEPTÉ:', name);
    return true;
  }

  // ÉTAPE 5: Exclusion des restaurants purs (sans composante bar)
  if (primaryType === 'restaurant' && !types.includes('bar')) {
    console.log('❌ [FILTRAGE] Restaurant pur - REJETÉ');
    return false;
  }

  // ÉTAPE 6: Décision finale basée sur les types
  if (hasAcceptableType) {
    console.log('✅ [FILTRAGE] Lieu ACCEPTÉ - type acceptable trouvé');
    return true;
  }

  console.log('❌ [FILTRAGE] Lieu REJETÉ - aucun critère accepté');
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

    console.log('🤖 [AUTO-ASSIGN AMÉLIORÉ] Attribution pour groupe:', group_id);

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

    // Coordonnées avec fallback sur Fort-de-France
    const searchLatitude = latitude || 14.633945;
    const searchLongitude = longitude || -61.027498;

    // Recherche avancée de bars
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 [RECHERCHE AMÉLIORÉE] Recherche de bars à Fort-de-France:', { searchLatitude, searchLongitude });

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub", "restaurant", "night_club"],
      locationRestriction: {
        circle: {
          center: { latitude: searchLatitude, longitude: searchLongitude },
          radius: 8000 // Rayon élargi
        }
      },
      maxResultCount: 20,
      languageCode: "fr-FR"
    };

    console.log('📡 [API REQUEST] Requête vers Google Places:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.regularOpeningHours,places.types,places.primaryType'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('❌ [API ERROR] Erreur HTTP:', response.status, await response.text());
      return new Response(
        JSON.stringify({ success: false, error: `Erreur API: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json();
    console.log('📊 [API RESPONSE] Réponse complète:', JSON.stringify(data, null, 2));

    if (!data.places || data.places.length === 0) {
      console.log('⚠️ [AUCUN RÉSULTAT] Google Places n\'a retourné aucun lieu');
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun lieu trouvé par Google Places' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📋 [RÉSULTATS BRUTS] Lieux trouvés initialement:', data.places.length);

    // Filtrage des lieux ouverts
    const openPlaces = data.places.filter(place => {
      const currentHours = place.currentOpeningHours;
      if (currentHours && currentHours.openNow !== undefined) {
        return currentHours.openNow === true;
      }
      return true;
    });

    console.log('🕐 [FILTRAGE HORAIRES] Lieux potentiellement ouverts:', openPlaces.length);

    // Application du filtrage avancé
    const realBars = openPlaces.filter(isRealBarOrPub);

    console.log('🍺 [FILTRAGE FINAL] Vrais bars après filtrage:', realBars.length);

    // Log détaillé des bars sélectionnés
    realBars.forEach((bar, index) => {
      console.log(`🏆 [BAR ${index + 1}] ${bar.displayName?.text} - Types: [${bar.types?.join(', ')}] - Primary: ${bar.primaryType}`);
    });

    // Fallback si aucun bar trouvé
    let selectedBars = realBars;
    if (realBars.length === 0) {
      console.log('⚠️ [FALLBACK] Aucun vrai bar trouvé, utilisation de tous les lieux ouverts');
      selectedBars = openPlaces;
    }

    if (selectedBars.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun bar ouvert trouvé malgré le filtrage élargi' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sélection aléatoire avec priorité aux bars avec mots-clés
    const priorityBars = selectedBars.filter(bar => {
      const name = bar.displayName?.text?.toLowerCase() || '';
      return ['bar', 'pub', 'brasserie', 'taverne', 'lounge'].some(keyword => name.includes(keyword));
    });

    const finalSelection = priorityBars.length > 0 ? priorityBars : selectedBars;
    const randomBar = finalSelection[Math.floor(Math.random() * finalSelection.length)];
    
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

    console.log('🎯 [SÉLECTION FINALE] Bar sélectionné:', {
      name: result.bar.name,
      types: randomBar.types,
      primaryType: randomBar.primaryType,
      wasPriority: priorityBars.length > 0
    });

    console.log('📊 [STATISTIQUES] Résumé de la recherche:', {
      totalFound: data.places.length,
      openPlaces: openPlaces.length,
      realBars: realBars.length,
      priorityBars: priorityBars.length,
      finalSelection: finalSelection.length
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [ERREUR GLOBALE]', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
