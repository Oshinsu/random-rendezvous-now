
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de priorisation des bars
const getBarPriority = (place: any): number => {
  const name = place.displayName?.text?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType || '';

  // PRIORITÉ 1: Bars purs (score 3) - SANS NIGHTCLUBS
  if (primaryType === 'bar' || primaryType === 'pub') {
    return 3;
  }

  // PRIORITÉ 2: Bar-restaurants (score 2)
  const isBarRestaurant = (types.includes('bar') && types.includes('restaurant')) ||
                         (primaryType === 'bar' && types.includes('restaurant')) ||
                         (primaryType === 'restaurant' && types.includes('bar'));
  
  if (isBarRestaurant) {
    return 2;
  }

  // PRIORITÉ 3: Bars d'hôtels (score 1)
  if (types.includes('bar') && (types.includes('hotel') || types.includes('lodging'))) {
    return 1;
  }

  // Autres (score 0)
  return 0;
};

// Fonction de vérification du statut d'ouverture avec Places Details API
const verifyBarBusinessStatus = async (placeId: string, apiKey: string): Promise<boolean> => {
  try {
    console.log(`🔍 [VERIFICATION STATUT] Vérification du statut pour place_id: ${placeId}`);
    
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    const response = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,businessStatus,currentOpeningHours'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️ [VERIFICATION STATUT] Erreur HTTP ${response.status} pour ${placeId}`);
      return true; // En cas d'erreur, on assume que le bar est ouvert
    }

    const data = await response.json();
    console.log(`📊 [VERIFICATION STATUT] Réponse API pour ${placeId}:`, {
      displayName: data.displayName?.text,
      businessStatus: data.businessStatus,
      openNow: data.currentOpeningHours?.openNow
    });

    // Vérifier le business_status
    if (data.businessStatus) {
      const status = data.businessStatus;
      if (status === 'CLOSED_TEMPORARILY' || status === 'CLOSED_PERMANENTLY') {
        console.log(`❌ [VERIFICATION STATUT] Bar fermé - statut: ${status}`);
        return false;
      }
      if (status === 'OPERATIONAL') {
        console.log(`✅ [VERIFICATION STATUT] Bar opérationnel - statut: ${status}`);
        return true;
      }
    }

    // Vérifier les heures d'ouverture actuelles en tant que fallback
    if (data.currentOpeningHours && data.currentOpeningHours.openNow !== undefined) {
      const isOpen = data.currentOpeningHours.openNow;
      console.log(`🕐 [VERIFICATION STATUT] Fallback heures d'ouverture: ${isOpen ? 'ouvert' : 'fermé'}`);
      return isOpen;
    }

    // Par défaut, on assume que le bar est ouvert si aucune info spécifique
    console.log(`📝 [VERIFICATION STATUT] Aucune info de statut, on assume ouvert`);
    return true;

  } catch (error) {
    console.error(`❌ [VERIFICATION STATUT] Erreur lors de la vérification pour ${placeId}:`, error);
    return true; // En cas d'erreur, on assume que le bar est ouvert
  }
};

// Fonction de filtrage ULTRA-STRICTE contre les fast-foods
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

  // ÉTAPE 1: Exclusion STRICTE des fast-foods - types
  const strictFastFoodTypes = [
    'fast_food_restaurant', 'meal_takeaway', 'hamburger_restaurant',
    'pizza_restaurant', 'sandwich_shop', 'american_restaurant'
  ];

  const hasFastFoodType = types.some((type: string) => strictFastFoodTypes.includes(type)) || 
                         strictFastFoodTypes.includes(primaryType);

  if (hasFastFoodType) {
    console.log('❌ [FILTRAGE] Lieu REJETÉ - type fast-food détecté:', primaryType, types);
    return false;
  }

  // ÉTAPE 2: Exclusion STRICTE des fast-foods - mots-clés
  const strictNegativeKeywords = [
    // Fast-foods internationaux
    'mcdonalds', 'mcdonald', 'burger king', 'kfc', 'subway', 'dominos',
    'pizza hut', 'quick', 'taco bell', 'wendy', 'five guys',
    // Fast-foods locaux
    'élizé', 'élize', 'elize', 'snack', 'fast food', 'fastfood',
    // Types de nourriture fast-food
    'chicken', 'fried chicken', 'tacos', 'burger', 'fries',
    'pizza delivery', 'takeaway', 'drive',
    // Autres exclusions
    'moto', 'motorcycle', 'concessionnaire', 'garage',
    'école', 'university', 'hôpital', 'pharmacie',
    'supermarché', 'magasin', 'station service'
  ];

  const hasCriticalNegative = strictNegativeKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  );

  if (hasCriticalNegative) {
    console.log('❌ [FILTRAGE] Lieu REJETÉ - mot-clé critique trouvé:', name);
    return false;
  }

  // ÉTAPE 3: Vérification positive - bars purs (SANS NIGHTCLUBS)
  const pureBarTypes = ['bar', 'pub', 'liquor_store'];
  const hasPureBarType = types.some((type: string) => pureBarTypes.includes(type)) || 
                        pureBarTypes.includes(primaryType);

  if (hasPureBarType) {
    console.log('✅ [FILTRAGE] Bar pur détecté - ACCEPTÉ:', name);
    return true;
  }

  // ÉTAPE 4: Vérification positive - bar-restaurants
  const isBarRestaurant = (types.includes('bar') && types.includes('restaurant')) ||
                         (primaryType === 'bar' && types.includes('restaurant')) ||
                         (primaryType === 'restaurant' && types.includes('bar'));

  if (isBarRestaurant) {
    console.log('🍽️ [FILTRAGE] Bar-restaurant détecté - ACCEPTÉ:', name);
    return true;
  }

  // ÉTAPE 5: Vérification positive - bars d'hôtels (en dernier recours)
  const isHotelBar = types.includes('bar') && (types.includes('hotel') || types.includes('lodging'));
  
  if (isHotelBar) {
    console.log('🏨 [FILTRAGE] Bar d\'hôtel détecté - ACCEPTÉ (priorité faible):', name);
    return true;
  }

  // ÉTAPE 6: Exclusion des restaurants purs
  if (primaryType === 'restaurant' && !types.includes('bar')) {
    console.log('❌ [FILTRAGE] Restaurant pur - REJETÉ');
    return false;
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

    console.log('🤖 [AUTO-ASSIGN STRICTE] Attribution pour groupe:', group_id);

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

    // Recherche STRICTE - SEULEMENT bars et pubs
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 [RECHERCHE STRICTE] Recherche UNIQUEMENT de bars et pubs:', { searchLatitude, searchLongitude });

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub"], // SEULEMENT bars et pubs !
      locationRestriction: {
        circle: {
          center: { latitude: searchLatitude, longitude: searchLongitude },
          radius: 8000
        }
      },
      maxResultCount: 20,
      languageCode: "fr-FR"
    };

    console.log('📡 [API REQUEST STRICTE] Requête vers Google Places:', JSON.stringify(requestBody, null, 2));

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

    // NOUVELLE ÉTAPE: Vérification du statut d'activité avec Places Details API
    console.log('🔍 [VERIFICATION STATUT] Début de la vérification du statut des bars...');
    const verifiedBars = [];
    
    for (const bar of realBars) {
      const isOperational = await verifyBarBusinessStatus(bar.id, apiKey);
      if (isOperational) {
        verifiedBars.push(bar);
        console.log(`✅ [VERIFICATION STATUT] Bar validé: ${bar.displayName?.text}`);
      } else {
        console.log(`❌ [VERIFICATION STATUT] Bar rejeté (fermé): ${bar.displayName?.text}`);
      }
    }

    console.log('🏢 [VERIFICATION STATUT] Bars opérationnels après vérification:', verifiedBars.length);

    // Log détaillé des bars sélectionnés
    realBars.forEach((bar, index) => {
      console.log(`🏆 [BAR ${index + 1}] ${bar.displayName?.text} - Types: [${bar.types?.join(', ')}] - Primary: ${bar.primaryType}`);
    });

    // Fallback si aucun bar vérifié trouvé
    let selectedBars = verifiedBars;
    if (verifiedBars.length === 0) {
      console.log('⚠️ [FALLBACK NIVEAU 1] Aucun bar vérifié, utilisation des bars filtrés');
      selectedBars = realBars;
    }
    if (selectedBars.length === 0) {
      console.log('⚠️ [FALLBACK NIVEAU 2] Aucun vrai bar trouvé, utilisation de tous les lieux ouverts');
      selectedBars = openPlaces;
    }

    if (selectedBars.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun bar opérationnel trouvé malgré le filtrage et la vérification' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // NOUVELLE SÉLECTION AVEC SYSTÈME DE PRIORITÉ
    const barsWithPriority = selectedBars.map(bar => ({
      bar,
      priority: getBarPriority(bar)
    }));

    console.log('🎯 [PRIORISATION] Analyse des priorités:');
    barsWithPriority.forEach(({ bar, priority }, index) => {
      const priorityLabel = priority === 3 ? 'BAR PUR' : 
                           priority === 2 ? 'BAR-RESTAURANT' : 
                           priority === 1 ? 'BAR D\'HÔTEL' : 'AUTRE';
      console.log(`   ${index + 1}. ${bar.displayName?.text} - Priorité: ${priority} (${priorityLabel})`);
    });

    // Sélection par ordre de priorité décroissant
    const maxPriority = Math.max(...barsWithPriority.map(b => b.priority));
    const topPriorityBars = barsWithPriority.filter(b => b.priority === maxPriority);
    
    console.log(`🏆 [SÉLECTION] ${topPriorityBars.length} bar(s) avec priorité maximale (${maxPriority})`);
    
    // Sélection aléatoire parmi les bars de plus haute priorité
    const randomSelection = topPriorityBars[Math.floor(Math.random() * topPriorityBars.length)];
    const randomBar = randomSelection.bar;
    
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
      priority: randomSelection.priority,
      priorityLabel: randomSelection.priority === 3 ? 'BAR PUR' : 
                    randomSelection.priority === 2 ? 'BAR-RESTAURANT' : 
                    randomSelection.priority === 1 ? 'BAR D\'HÔTEL' : 'AUTRE'
    });

    console.log('📊 [STATISTIQUES] Résumé de la recherche:', {
      totalFound: data.places.length,
      openPlaces: openPlaces.length,
      realBars: realBars.length,
      verifiedBars: verifiedBars.length,
      maxPriority: maxPriority,
      selectedPriority: randomSelection.priority
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
