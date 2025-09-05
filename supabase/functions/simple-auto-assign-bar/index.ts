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
const verifyBarBusinessStatus = async (placeId: string, apiKey: string, groupId?: string): Promise<boolean> => {
  try {
    console.log(`🔍 [VERIFICATION STATUT] Vérification du statut pour place_id: ${placeId}`);
    
    const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    const startTime = Date.now();
    const response = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,businessStatus,currentOpeningHours'
      }
    });

    const responseTime = Date.now() - startTime;

    // Log de l'appel API
    await logApiRequest(
      `/places/${placeId}`,
      'place_details',
      response.status,
      responseTime,
      groupId,
      !response.ok ? `HTTP ${response.status}` : undefined,
      { place_id: placeId }
    );

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

// Liste noire manuelle des bars à exclure
const MANUAL_BLACKLIST = [
  'ti plage',
  // Ajouter d'autres bars problématiques ici
];

// Fonction AMÉLIORÉE de filtrage intelligent contre les lieux non désirés
const isRealBarOrPub = (place: any): boolean => {
  const name = place.displayName?.text?.toLowerCase() || '';
  const address = place.formattedAddress?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType || '';

  console.log('🔍 [FILTRAGE INTELLIGENT] Analyse du lieu:', {
    name: place.displayName?.text,
    types: types,
    primaryType: primaryType,
    address: place.formattedAddress
  });

  // ÉTAPE 0: Vérification de la liste noire manuelle
  const isBlacklisted = MANUAL_BLACKLIST.some(blacklistedName => 
    name.includes(blacklistedName)
  );

  if (isBlacklisted) {
    console.log('❌ [LISTE NOIRE] Bar exclu manuellement:', place.displayName?.text);
    return false;
  }

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

  // ÉTAPE 2: Exclusion INTELLIGENTE des bars d'aéroports
  const airportKeywords = [
    // Mots-clés d'aéroport dans l'adresse
    'aéroport', 'airport', 'aimé césaire', 'martinique aimé césaire',
    'terminal', 'departure', 'arrival', 'gate', 'boarding',
    // Codes aéroports
    'fdf', 'orly', 'cdg', 'roissy',
    // Zones aéroportuaires
    'zone aéroportuaire', 'airside', 'duty free'
  ];

  // Mots-clés dans les noms d'établissements aéroportuaires
  const airportEstablishmentKeywords = [
    'air france', 'air caraïbes', 'corsair', 'american airlines',
    'delta', 'lufthansa', 'klm', 'british airways'
  ];

  const hasAirportLocation = airportKeywords.some(keyword => 
    address.includes(keyword)
  );

  const hasAirportEstablishment = airportEstablishmentKeywords.some(keyword =>
    name.includes(keyword)
  );

  if (hasAirportLocation || hasAirportEstablishment) {
    console.log('❌ [FILTRAGE] Bar d\'aéroport REJETÉ:', {
      name: place.displayName?.text,
      reason: hasAirportLocation ? 'adresse aéroportuaire' : 'nom compagnie aérienne',
      address: address
    });
    return false;
  }

  // ÉTAPE 3: Exclusion des bars de ports
  const portKeywords = [
    'port', 'marina', 'quai', 'môle', 'embarcadère', 'ferry',
    'terminal maritime', 'gare maritime', 'capitainerie',
    'yacht club', 'club nautique', 'port de plaisance'
  ];

  const hasPortLocation = portKeywords.some(keyword => 
    address.includes(keyword) || name.includes(keyword)
  );

  if (hasPortLocation) {
    console.log('❌ [FILTRAGE] Bar de port REJETÉ:', place.displayName?.text);
    return false;
  }

  // ÉTAPE 4: Exclusion des bar-tabacs et PMU
  const tobaccoPmuKeywords = [
    'tabac', 'bureau de tabac', 'bar tabac', 'bar-tabac',
    'pmu', 'pari mutuel', 'paris sportifs', 'française des jeux',
    'fdj', 'loto', 'tiercé', 'quinté', 'rapido'
  ];

  const isTobaccoPmu = tobaccoPmuKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  );

  // Vérification par types Google
  const tobaccoTypes = ['tobacco_shop', 'convenience_store'];
  const hasTobaccoType = types.some((type: string) => tobaccoTypes.includes(type));

  if (isTobaccoPmu || hasTobaccoType) {
    console.log('❌ [FILTRAGE] Bar-tabac/PMU REJETÉ:', place.displayName?.text);
    return false;
  }

  // ÉTAPE 5: Exclusion STRICTE des fast-foods - mots-clés
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

  // ÉTAPE 6: Vérification positive - bars purs (SANS NIGHTCLUBS)
  const pureBarTypes = ['bar', 'pub', 'liquor_store'];
  const hasPureBarType = types.some((type: string) => pureBarTypes.includes(type)) || 
                        pureBarTypes.includes(primaryType);

  if (hasPureBarType) {
    console.log('✅ [FILTRAGE] Bar pur détecté - ACCEPTÉ:', name);
    return true;
  }

  // ÉTAPE 7: Vérification positive - bar-restaurants
  const isBarRestaurant = (types.includes('bar') && types.includes('restaurant')) ||
                         (primaryType === 'bar' && types.includes('restaurant')) ||
                         (primaryType === 'restaurant' && types.includes('bar'));

  if (isBarRestaurant) {
    console.log('🍽️ [FILTRAGE] Bar-restaurant détecté - ACCEPTÉ:', name);
    return true;
  }

  // ÉTAPE 8: Vérification positive - bars d'hôtels (en dernier recours)
  const isHotelBar = types.includes('bar') && (types.includes('hotel') || types.includes('lodging'));
  
  if (isHotelBar) {
    console.log('🏨 [FILTRAGE] Bar d\'hôtel détecté - ACCEPTÉ (priorité faible):', name);
    return true;
  }

  // ÉTAPE 9: Exclusion des restaurants purs
  if (primaryType === 'restaurant' && !types.includes('bar')) {
    console.log('❌ [FILTRAGE] Restaurant pur - REJETÉ');
    return false;
  }

  console.log('❌ [FILTRAGE] Lieu REJETÉ - aucun critère accepté');
  return false;
};

// Fonction de logging API
const logApiRequest = async (endpoint: string, requestType: string, statusCode: number, responseTimeMs: number, groupId?: string, errorMessage?: string, metadata?: any) => {
  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/api-logger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        api_name: 'google_places',
        endpoint,
        request_type: requestType,
        status_code: statusCode,
        response_time_ms: responseTimeMs,
        cost_usd: requestType === 'nearby_search' ? 0.017 : 0.003,
        error_message: errorMessage,
        group_id: groupId,
        metadata
      })
    });
  } catch (error) {
    console.error('❌ [LOG API] Erreur logging:', error);
  }
};

// Fonction de recherche avec rayon variable
const searchBarsWithRadius = async (latitude: number, longitude: number, radius: number, apiKey: string, groupId?: string): Promise<any[]> => {
  const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
  const requestBody = {
    includedTypes: ["bar", "pub"],
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius: radius
      }
    },
    maxResultCount: 20,
    languageCode: "fr-FR"
  };

  console.log(`📡 [RECHERCHE RAYON ${radius}m] Requête vers Google Places:`, JSON.stringify(requestBody, null, 2));

  const startTime = Date.now();
  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.regularOpeningHours,places.types,places.primaryType'
    },
    body: JSON.stringify(requestBody)
  });

  const responseTime = Date.now() - startTime;

  // Log de l'appel API
  await logApiRequest(
    '/places:searchNearby',
    'nearby_search',
    response.status,
    responseTime,
    groupId,
    !response.ok ? `HTTP ${response.status}` : undefined,
    { radius, coordinates: { latitude, longitude } }
  );

  if (!response.ok) {
    console.error(`❌ [RECHERCHE RAYON ${radius}m] Erreur HTTP:`, response.status);
    return [];
  }

  const data = await response.json();
  return data.places || [];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();

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

    console.log('🤖 [AUTO-ASSIGN INTELLIGENTE AMÉLIORÉE] Attribution avec filtrage renforcé pour groupe:', group_id);

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

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 [RECHERCHE INTELLIGENTE AMÉLIORÉE] Début avec filtrage renforcé:', { searchLatitude, searchLongitude });

    // NOUVEAU: Détection utilisateur IDF et redirection vers Paris
    let finalLatitude = searchLatitude;
    let finalLongitude = searchLongitude;
    let isIdfUser = false;
    
    try {
      // Faire un reverse geocoding pour détecter la localisation
      const reverseGeoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${searchLatitude}&lon=${searchLongitude}&zoom=14&addressdetails=1`;
      const geoResponse = await fetch(reverseGeoUrl, {
        headers: { 'User-Agent': 'Random-App/1.0' }
      });
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        const locationName = geoData.display_name || '';
        const address = geoData.address || {};
        
        // Détecter si utilisateur est en Île-de-France
        const fullAddress = `${address.city || ''} ${address.postcode || ''} ${address.state || ''}`.toLowerCase();
        
        // Codes postaux IDF et villes principales
        const idfPostalCodes = /\b(75\d{3}|77\d{3}|78\d{3}|91\d{3}|92\d{3}|93\d{3}|94\d{3}|95\d{3})\b/;
        const idfKeywords = ['paris', 'île-de-france', 'hauts-de-seine', 'seine-saint-denis', 'val-de-marne'];
        
        isIdfUser = idfPostalCodes.test(fullAddress) || 
                   idfKeywords.some(keyword => locationName.toLowerCase().includes(keyword) || fullAddress.includes(keyword));
        
        if (isIdfUser) {
          // Rediriger la recherche vers le centre de Paris
          finalLatitude = 48.8566;  // Centre de Paris
          finalLongitude = 2.3522;
          console.log('🗼 [REDIRECTION PARIS] Utilisateur IDF détecté - recherche redirigée vers Paris intra-muros');
          console.log(`📍 [REDIRECTION PARIS] Coordonnées originales: ${searchLatitude}, ${searchLongitude}`);
          console.log(`🎯 [REDIRECTION PARIS] Nouvelles coordonnées: ${finalLatitude}, ${finalLongitude}`);
        } else {
          console.log('🌍 [GÉOLOCALISATION] Utilisateur hors IDF - recherche normale');
        }
      }
    } catch (error) {
      console.log('⚠️ [GÉOLOCALISATION] Erreur reverse geocoding, utilisation coordonnées originales:', error);
    }

    // NOUVEAU SYSTÈME DE FALLBACK INTELLIGENT avec adaptation IDF
    let selectedBars = [];
    let searchRadius = isIdfUser ? 12000 : 25000; // Rayon réduit pour Paris intra-muros
    let fallbackLevel = 0;

    // NIVEAU 1: Recherche prioritaire (Paris pour IDF, normale pour autres)
    const searchType = isIdfUser ? 'Paris intra-muros (12km)' : 'normale (25km)';
    console.log(`🎯 [FALLBACK NIVEAU 1] Recherche ${searchType}`);
    let allPlaces = await searchBarsWithRadius(finalLatitude, finalLongitude, searchRadius, apiKey, group_id);
    
    if (allPlaces.length === 0) {
      console.log('⚠️ [FALLBACK NIVEAU 1] Aucun lieu trouvé - passage au niveau 2');
      fallbackLevel = 1;
    } else {
      console.log(`📋 [FALLBACK NIVEAU 1] ${allPlaces.length} lieux trouvés initialement`);

      // Filtrage des lieux ouverts
      const openPlaces = allPlaces.filter(place => {
        const currentHours = place.currentOpeningHours;
        if (currentHours && currentHours.openNow !== undefined) {
          return currentHours.openNow === true;
        }
        return true; // Si pas d'info, on assume ouvert
      });

      console.log(`🕐 [FALLBACK NIVEAU 1] ${openPlaces.length} lieux potentiellement ouverts`);

      // Application du filtrage strict
      const realBars = openPlaces.filter(isRealBarOrPub);
      console.log(`🍺 [FALLBACK NIVEAU 1] ${realBars.length} vrais bars après filtrage strict`);

      if (realBars.length > 0) {
        // Vérification du statut avec Places Details API
        console.log('🔍 [FALLBACK NIVEAU 1] Vérification statut opérationnel...');
        for (const bar of realBars) {
          const isOperational = await verifyBarBusinessStatus(bar.id, apiKey);
          if (isOperational) {
            selectedBars.push(bar);
            console.log(`✅ [FALLBACK NIVEAU 1] Bar validé: ${bar.displayName?.text}`);
          } else {
            console.log(`❌ [FALLBACK NIVEAU 1] Bar rejeté (fermé): ${bar.displayName?.text}`);
          }
        }

        if (selectedBars.length > 0) {
          console.log(`🏆 [FALLBACK NIVEAU 1] ${selectedBars.length} bars opérationnels trouvés`);
        } else {
          console.log('⚠️ [FALLBACK NIVEAU 1] Aucun bar opérationnel - passage au niveau 2');
          fallbackLevel = 2;
          selectedBars = realBars; // Utiliser les bars filtrés mais non vérifiés
        }
      } else {
        console.log('⚠️ [FALLBACK NIVEAU 1] Aucun vrai bar trouvé - passage au niveau 2');
        fallbackLevel = 2;
      }
    }

    // NIVEAU 2: Fallback intelligent
    if (fallbackLevel >= 1 && selectedBars.length === 0) {
      if (isIdfUser) {
        console.log('🔄 [FALLBACK NIVEAU 2 IDF] Retour aux coordonnées utilisateur (25km)');
        finalLatitude = searchLatitude;  // Retour aux coordonnées originales
        finalLongitude = searchLongitude;
        searchRadius = 25000;
      } else {
        console.log('🎯 [FALLBACK NIVEAU 2] Expansion du rayon à 35km');
        searchRadius = 35000;
      }
      allPlaces = await searchBarsWithRadius(finalLatitude, finalLongitude, searchRadius, apiKey, group_id);
      
      if (allPlaces.length > 0) {
        const openPlaces = allPlaces.filter(place => {
          const currentHours = place.currentOpeningHours;
          if (currentHours && currentHours.openNow !== undefined) {
            return currentHours.openNow === true;
          }
          return true;
        });

        const realBars = openPlaces.filter(isRealBarOrPub);
        console.log(`🍺 [FALLBACK NIVEAU 2] ${realBars.length} vrais bars trouvés avec rayon étendu`);

        if (realBars.length > 0) {
          selectedBars = realBars;
          console.log(`✅ [FALLBACK NIVEAU 2] Utilisation des bars filtrés (non vérifiés)`);
        } else {
          console.log('⚠️ [FALLBACK NIVEAU 2] Aucun vrai bar trouvé - passage au niveau 3');
          fallbackLevel = 3;
        }
      } else {
        console.log('⚠️ [FALLBACK NIVEAU 2] Aucun lieu trouvé - passage au niveau 3');
        fallbackLevel = 3;
      }
    }

    // NIVEAU 3: Rayon maximal
    if (fallbackLevel >= 3 && selectedBars.length === 0) {
      console.log('🎯 [FALLBACK NIVEAU 3] Expansion du rayon à 50km (dernier recours)');
      searchRadius = 50000;
      // Utiliser les coordonnées originales pour le fallback final
      allPlaces = await searchBarsWithRadius(searchLatitude, searchLongitude, searchRadius, apiKey, group_id);
      
      if (allPlaces.length > 0) {
        const openPlaces = allPlaces.filter(place => {
          const currentHours = place.currentOpeningHours;
          if (currentHours && currentHours.openNow !== undefined) {
            return currentHours.openNow === true;
          }
          return true;
        });

        const realBars = openPlaces.filter(isRealBarOrPub);
        console.log(`🍺 [FALLBACK NIVEAU 3] ${realBars.length} vrais bars trouvés avec rayon maximal`);

        if (realBars.length > 0) {
          selectedBars = realBars;
          console.log(`✅ [FALLBACK NIVEAU 3] Utilisation des bars filtrés (rayon maximal)`);
        }
      }
    }

    // ÉCHEC FINAL: Aucun bar trouvé malgré tous les fallbacks
    if (selectedBars.length === 0) {
      console.log('❌ [ÉCHEC TOTAL] Aucun bar trouvé malgré tous les niveaux de fallback');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun bar trouvé dans votre région',
          details: `Recherche effectuée jusqu'à ${searchRadius/1000}km sans succès`,
          fallbackLevel: fallbackLevel,
          searchRadius: searchRadius
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // SÉLECTION FINALE AVEC SYSTÈME DE PRIORITÉ ET RAPPORT FRANÇAIS
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
                    randomSelection.priority === 1 ? 'BAR D\'HÔTEL' : 'AUTRE',
      fallbackLevel: fallbackLevel,
      searchRadius: searchRadius
    });

    // RAPPORT FRANÇAIS DÉTAILLÉ
    console.log('📊 [RAPPORT FILTRAGE FRANÇAIS] Attribution automatique avec filtrage intelligent:', {
      'Lieux trouvés initialement': allPlaces.length,
      'Lieux après filtrage qualité': selectedBars.length,
      'Bars d\'aéroport exclus': '✅ Détection par adresse et nom',
      'Bars de port exclus': '✅ Détection par mots-clés portuaires',
      'Bar-tabacs exclus': '✅ Détection par types et mots-clés',
      'PMU exclus': '✅ Détection par mots-clés paris',
      'Fast-foods exclus': '✅ Détection stricte',
      'Priorité maximale': maxPriority,
      'Priorité sélectionnée': randomSelection.priority,
      'Niveau de fallback': fallbackLevel,
      'Rayon de recherche': `${searchRadius/1000}km`,
      'Bar final': result.bar.name
    });

    // Log successful API call
    try {
      await supabase.functions.invoke('api-logger', {
        body: {
          api_name: 'simple-auto-assign-bar',
          endpoint: '/functions/v1/simple-auto-assign-bar',
          request_type: 'assignment',
          status_code: 200,
          response_time_ms: Date.now() - startTime,
          cost_usd: 0.017, // Google Places Search cost
          group_id,
          metadata: { 
            latitude: searchLatitude, 
            longitude: searchLongitude, 
            assigned_bar: result.bar.name,
            total_bars_found: selectedBars.length,
            fallback_level: fallbackLevel,
            search_radius: searchRadius
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log API success:', logError);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [ERREUR GLOBALE]', error);
    
    // Log API error
    try {
      await supabase.functions.invoke('api-logger', {
        body: {
          api_name: 'simple-auto-assign-bar',
          endpoint: '/functions/v1/simple-auto-assign-bar',
          request_type: 'assignment',
          status_code: 500,
          response_time_ms: Date.now() - startTime,
          cost_usd: 0,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          group_id: group_id || undefined,
          metadata: { error_details: error }
        }
      });
    } catch (logError) {
      console.error('Failed to log API error:', logError);
    }
    
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
