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

  let group_id: string | undefined;
  
  try {
    const body = await req.json();
    group_id = body.group_id;
    const latitude = body.latitude;
    const longitude = body.longitude;

    if (!group_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'group_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🤖 [AUTO-ASSIGN INTELLIGENTE AMÉLIORÉE] Attribution avec filtrage renforcé pour groupe:', group_id);

    // Récupérer le groupe avec ses coordonnées
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('current_participants, status, bar_name, latitude, longitude, search_radius')
      .eq('id', group_id)
      .single();

    if (groupError || !group) {
      console.error('❌ [AUTO-ASSIGN] Groupe introuvable:', group_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Groupe introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (group.status !== 'confirmed' || group.bar_name) {
      console.log('⚠️ [AUTO-ASSIGN] Groupe non éligible:', { status: group.status, bar_name: group.bar_name });
      return new Response(
        JSON.stringify({ success: false, error: 'Groupe non éligible' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ✅ Utiliser les coordonnées du groupe (fallback sur Fort-de-France si aucune coordonnée)
    const searchLatitude = latitude || group.latitude || 14.633945;
    const searchLongitude = longitude || group.longitude || -61.027498;
    
    console.log('📍 [AUTO-ASSIGN] Coordonnées de recherche:', {
      provided: { latitude, longitude },
      fromGroup: { latitude: group.latitude, longitude: group.longitude },
      final: { searchLatitude, searchLongitude }
    });

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 [RECHERCHE INTELLIGENTE AMÉLIORÉE] Début avec filtrage renforcé:', { searchLatitude, searchLongitude });

    // NOUVEAU: Détection utilisateur IDF et redirection vers Paris (avec diagnostic renforcé)
    let finalLatitude = searchLatitude;
    let finalLongitude = searchLongitude;
    let isIdfUser = false;
    let detectionMethod = 'none';
    
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
        
        console.log('🔍 [DIAGNOSTIC IDF] Données géocodage:', {
          display_name: locationName,
          city: address.city,
          postcode: address.postcode,
          state: address.state,
          country: address.country
        });
        
        // Détecter si utilisateur est en Île-de-France
        const fullAddress = `${address.city || ''} ${address.postcode || ''} ${address.state || ''}`.toLowerCase();
        
        // Codes postaux IDF et villes principales
        const idfPostalCodes = /\b(75\d{3}|77\d{3}|78\d{3}|91\d{3}|92\d{3}|93\d{3}|94\d{3}|95\d{3})\b/;
        const idfKeywords = ['paris', 'île-de-france', 'hauts-de-seine', 'seine-saint-denis', 'val-de-marne', 'essonne', 'yvelines', 'val-d\'oise', 'seine-et-marne'];
        
        // Tests de détection avec logging
        const postalTest = idfPostalCodes.test(fullAddress);
        const keywordTest = idfKeywords.some(keyword => locationName.toLowerCase().includes(keyword) || fullAddress.includes(keyword));
        
        console.log('🧪 [DIAGNOSTIC IDF] Tests de détection:', {
          fullAddress,
          locationName: locationName.toLowerCase(),
          postalTest,
          keywordTest
        });
        
        isIdfUser = postalTest || keywordTest;
        detectionMethod = postalTest ? 'postal_code' : keywordTest ? 'keyword' : 'none';
        
        if (isIdfUser) {
          // Rediriger la recherche vers le centre de Paris
          finalLatitude = 48.8566;  // Centre de Paris (Place du Châtelet)
          finalLongitude = 2.3522;
          console.log('🗼 [REDIRECTION PARIS] ✅ Utilisateur IDF détecté - recherche redirigée vers Paris intra-muros');
          console.log(`📍 [REDIRECTION PARIS] Coordonnées originales: ${searchLatitude}, ${searchLongitude}`);
          console.log(`🎯 [REDIRECTION PARIS] Nouvelles coordonnées: ${finalLatitude}, ${finalLongitude}`);
          console.log(`🔍 [REDIRECTION PARIS] Méthode de détection: ${detectionMethod}`);
        } else {
          console.log('🌍 [GÉOLOCALISATION] ❌ Utilisateur hors IDF - recherche normale');
          console.log(`🔍 [GÉOLOCALISATION] Location: ${locationName}`);
        }
      } else {
        console.log('⚠️ [GÉOLOCALISATION] Erreur API géocodage, code:', geoResponse.status);
      }
    } catch (error) {
      console.log('⚠️ [GÉOLOCALISATION] Erreur reverse geocoding, utilisation coordonnées originales:', error);
    }

    // Recherche simplifiée avec rayon fixe de 25km pour tous
    console.log('🎯 [RECHERCHE SIMPLIFIÉE] Rayon fixe de 25km pour tous les utilisateurs');
    let allPlaces = await searchBarsWithRadius(finalLatitude, finalLongitude, 25000, apiKey, group_id);
    
    if (allPlaces.length === 0) {
      console.log('💥 [RECHERCHE SIMPLIFIÉE] Aucun lieu trouvé');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun bar trouvé dans la zone',
          searchRadius: 25000 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 [RECHERCHE SIMPLIFIÉE] ${allPlaces.length} lieux trouvés`);

    // Filtrage des lieux ouverts
    const openPlaces = allPlaces.filter(place => {
      const currentHours = place.currentOpeningHours;
      if (currentHours && currentHours.openNow !== undefined) {
        return currentHours.openNow === true;
      }
      return true; // Si pas d'info, on assume ouvert
    });

    console.log(`🕐 [RECHERCHE SIMPLIFIÉE] ${openPlaces.length} lieux potentiellement ouverts`);

    // Application du filtrage strict
    const realBars = openPlaces.filter(isRealBarOrPub);
    console.log(`🍺 [RECHERCHE SIMPLIFIÉE] ${realBars.length} vrais bars après filtrage strict`);

    if (realBars.length === 0) {
      console.log('💥 [RECHERCHE SIMPLIFIÉE] Aucun vrai bar trouvé');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun bar valide trouvé',
          totalPlacesFound: allPlaces.length 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérification du statut avec Places Details API
    let selectedBars = [];
    console.log('🔍 [RECHERCHE SIMPLIFIÉE] Vérification statut opérationnel...');
    for (const bar of realBars) {
      const isOperational = await verifyBarBusinessStatus(bar.id, apiKey, group_id);
      if (isOperational) {
        selectedBars.push(bar);
        console.log(`✅ [RECHERCHE SIMPLIFIÉE] Bar validé: ${bar.displayName?.text}`);
      } else {
        console.log(`❌ [RECHERCHE SIMPLIFIÉE] Bar rejeté (fermé): ${bar.displayName?.text}`);
      }
    }

    // Si aucun bar opérationnel, utiliser les bars filtrés
    if (selectedBars.length === 0) {
      console.log('⚠️ [RECHERCHE SIMPLIFIÉE] Aucun bar opérationnel vérifié, utilisation des bars filtrés');
      selectedBars = realBars;
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
      searchRadius: 25000,
      idfRedirection: isIdfUser
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
      'Rayon de recherche': '25km',
      'Redirection IDF': isIdfUser,
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
            latitude: finalLatitude, 
            longitude: finalLongitude, 
            assigned_bar: result.bar.name,
            total_bars_found: selectedBars.length,
            search_radius: 25000,
            idf_redirection: isIdfUser
          }
        }
      });
    } catch (logError) {
      console.error('Failed to log API success:', logError);
    }

    // ✅ ÉTAPE CRITIQUE : Mettre à jour le groupe avec le bar assigné
    console.log('💾 [UPDATE DB] Mise à jour du groupe avec le bar assigné...');

    const meetingTime = new Date();
    meetingTime.setHours(meetingTime.getHours() + 1); // RDV dans 1h

    const { error: updateError } = await supabase
      .from('groups')
      .update({
        bar_name: result.bar.name,
        bar_address: result.bar.formatted_address,
        bar_place_id: result.bar.place_id,
        bar_latitude: result.bar.geometry.location.lat,
        bar_longitude: result.bar.geometry.location.lng,
        meeting_time: meetingTime.toISOString()
      })
      .eq('id', group_id);

    if (updateError) {
      console.error('❌ [UPDATE DB] Erreur lors de la mise à jour:', updateError);
      throw new Error(`Échec update DB: ${updateError.message}`);
    }

    console.log('✅ [UPDATE DB] Groupe mis à jour avec succès');

    // Message système dans le chat du groupe
    const { error: messageError } = await supabase
      .from('group_messages')
      .insert({
        group_id: group_id,
        user_id: '00000000-0000-0000-0000-000000000000', // Système
        message: `🎉 Bar assigné ! Rendez-vous au ${result.bar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
        is_system: true
      });

    if (messageError) {
      console.error('⚠️ [MESSAGE] Erreur création message système:', messageError);
      // Non-bloquant, on continue
    }

    console.log('✅ [MESSAGE] Message système créé dans le chat');

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
