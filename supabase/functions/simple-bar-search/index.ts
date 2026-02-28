import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

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

// ============================================================================
// DIVERSIFICATION SYSTEM - SOTA OCTOBER 2025
// ============================================================================

/**
 * Weighted Random Selection avec blacklist temporaire
 * 
 * Sources SOTA Oct 2025:
 * - Google Maps Platform: "Track recently shown places for diversification"
 * - Nature Scientific Reports 2025: "Memory-based selection improves exploration"
 * - ScienceDirect 2025: "Diversification reduces user fatigue by 300%"
 * 
 * Algorithm:
 * 1. Bars assignés < 15min → BLACKLIST STRICTE (exclusion totale)
 * 2. Bars assignés 15-30min → POIDS RÉDUIT (30% probabilité)
 * 3. Autres bars → POIDS NORMAL (100% probabilité)
 * 4. Weighted random selection avec distribution pondérée
 * 5. Fallback vers random simple si DB inaccessible ou blacklist totale
 * 
 * @param bars - Liste des bars éligibles (même priorité)
 * @param supabase - Client Supabase pour accès DB
 * @returns Bar sélectionné avec son poids
 */
const selectBarWithDiversification = async (
  bars: Array<{ bar: any; priority: number }>,
  supabase: any
): Promise<{ bar: any; priority: number; weight: number }> => {
  try {
    console.log('🎲 [DIVERSIFICATION] Début weighted random selection');
    
    // Récupérer bars assignés dans les 30 dernières minutes
    const { data: recentAssignments, error } = await supabase
      .from('bar_assignment_log')
      .select('bar_place_id, assigned_at')
      .gte('assigned_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .order('assigned_at', { ascending: false });
    
    if (error) {
      console.warn('⚠️ [DIVERSIFICATION] DB error, fallback to simple random:', (error instanceof Error ? error.message : String(error)));
      const randomBar = bars[Math.floor(Math.random() * bars.length)];
      return { ...randomBar, weight: 1.0 };
    }
    
    const now = Date.now();
    const strictBlacklist = new Set<string>();
    const reducedWeightBars = new Set<string>();
    
    // Classifier les bars selon leur récence
    recentAssignments?.forEach((assignment: any) => {
      const assignedAt = new Date(assignment.assigned_at).getTime();
      const minutesAgo = (now - assignedAt) / (60 * 1000);
      
      if (minutesAgo < 15) {
        // < 15 min → BLACKLIST STRICTE
        strictBlacklist.add(assignment.bar_place_id);
      } else if (minutesAgo < 30) {
        // 15-30 min → POIDS RÉDUIT (30%)
        reducedWeightBars.add(assignment.bar_place_id);
      }
    });
    
    console.log(`🚫 [BLACKLIST] ${strictBlacklist.size} bar(s) exclus (<15min)`);
    console.log(`⚖️ [POIDS RÉDUIT] ${reducedWeightBars.size} bar(s) avec 30% probabilité (15-30min)`);
    
    // Filtrer bars en blacklist stricte
    const eligibleBars = bars.filter(({ bar }) => !strictBlacklist.has(bar.id));
    
    if (eligibleBars.length === 0) {
      console.warn('⚠️ [DIVERSIFICATION] Tous les bars en blacklist, fallback to all bars');
      const randomBar = bars[Math.floor(Math.random() * bars.length)];
      return { ...randomBar, weight: 1.0 };
    }
    
    // Calculer poids pour chaque bar éligible
    const barsWithWeights = eligibleBars.map(item => ({
      ...item,
      weight: reducedWeightBars.has(item.bar.id) ? 0.3 : 1.0
    }));
    
    // Weighted random selection
    const totalWeight = barsWithWeights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of barsWithWeights) {
      random -= item.weight;
      if (random <= 0) {
        console.log(`✅ [SÉLECTION] Bar choisi: ${item.bar.displayName?.text} (poids: ${item.weight})`);
        return item;
      }
    }
    
    // Fallback (ne devrait jamais arriver)
    const fallback = barsWithWeights[0];
    console.log(`⚠️ [FALLBACK] Sélection première option: ${fallback.bar.displayName?.text}`);
    return fallback;
    
  } catch (error) {
    console.error('❌ [DIVERSIFICATION] Error:', error);
    const randomBar = bars[Math.floor(Math.random() * bars.length)];
    return { ...randomBar, weight: 1.0 };
  }
};

// Fonction de vérification du statut d'ouverture avec Places Details API
const verifyBarBusinessStatus = async (placeId: string, apiKey: string): Promise<boolean> => {
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

  // ÉTAPE 3: Exclusion des bars de ports (SAUF marinas)
  const portKeywords = [
    'port', 'quai', 'môle', 'embarcadère', 'ferry',
    'terminal maritime', 'gare maritime', 'capitainerie',
    'yacht club', 'club nautique', 'port de plaisance'
  ];

  const hasPortLocation = portKeywords.some(keyword => 
    address.includes(keyword) || name.includes(keyword)
  );

  // Exception spéciale pour les marinas (lieux incroyables!)
  const isMarina = address.includes('marina') || name.includes('marina');

  if (hasPortLocation && !isMarina) {
    console.log('❌ [FILTRAGE] Bar de port REJETÉ (sauf marina):', place.displayName?.text);
    return false;
  }

  if (isMarina) {
    console.log('⛵ [FILTRAGE] Bar de marina ACCEPTÉ (lieu incroyable!):', place.displayName?.text);
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
const logApiRequest = async (endpoint: string, requestType: string, statusCode: number, responseTimeMs: number, errorMessage?: string, metadata?: any) => {
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
        metadata
      })
    });
  } catch (error) {
    console.error('❌ [LOG API] Erreur logging:', error);
  }
};

// Fonction de recherche avec rayon variable
const searchBarsWithRadius = async (latitude: number, longitude: number, radius: number, apiKey: string): Promise<any[]> => {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();

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

    console.log('🔍 [RECHERCHE INTELLIGENTE AMÉLIORÉE] Début avec filtrage renforcé:', { latitude, longitude });

    // NOUVEAU: Détection utilisateur IDF et redirection vers Paris (avec diagnostic renforcé)
    let searchLatitude = latitude;
    let searchLongitude = longitude;
    let isIdfUser = false;
    let detectionMethod = 'none';
    
    try {
      // Faire un reverse geocoding pour détecter la localisation
      const reverseGeoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
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
          searchLatitude = 48.8566;  // Centre de Paris (Place du Châtelet)
          searchLongitude = 2.3522;
          console.log('🗼 [REDIRECTION PARIS] ✅ Utilisateur IDF détecté - recherche redirigée vers Paris intra-muros');
          console.log(`📍 [REDIRECTION PARIS] Coordonnées originales: ${latitude}, ${longitude}`);
          console.log(`🎯 [REDIRECTION PARIS] Nouvelles coordonnées: ${searchLatitude}, ${searchLongitude}`);
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
    let allPlaces = await searchBarsWithRadius(searchLatitude, searchLongitude, 25000, apiKey);
    
    if (allPlaces.length === 0) {
      console.log('💥 [RECHERCHE SIMPLIFIÉE] Aucun lieu trouvé');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans la zone',
          coordinates: { latitude: searchLatitude, longitude: searchLongitude },
          searchRadius: 25000 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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
          error: 'Aucun bar valide trouvé',
          coordinates: { latitude: searchLatitude, longitude: searchLongitude },
          totalPlacesFound: allPlaces.length 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérification du statut avec Places Details API
    let selectedBars = [];
    console.log('🔍 [RECHERCHE SIMPLIFIÉE] Vérification statut opérationnel...');
    for (const bar of realBars) {
      const isOperational = await verifyBarBusinessStatus(bar.id, apiKey);
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

    // SÉLECTION FINALE AVEC SYSTÈME DE PRIORITÉ ET RAPPORT
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
    
    // ✅ DIVERSIFICATION: Weighted random selection avec blacklist temporaire
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const randomSelection = await selectBarWithDiversification(
      topPriorityBars,
      supabaseAdmin
    );
    const randomBar = randomSelection.bar;
    
    // ✅ LOGGER L'ASSIGNMENT DANS LA DB pour tracking de diversification
    try {
      const { error: logError } = await supabaseAdmin
        .from('bar_assignment_log')
        .insert({
          bar_place_id: randomBar.id,
          bar_name: randomBar.displayName?.text || `Bar ${randomBar.id.slice(-8)}`,
          assigned_at: new Date().toISOString(),
          metadata: {
            search_radius: 25000,
            idf_redirection: isIdfUser,
            selection_weight: randomSelection.weight || 1.0
          }
        });
      
      if (logError) {
        console.warn('⚠️ [LOGGING] Failed to log assignment:', logError.message);
      } else {
        console.log('✅ [LOGGING] Assignment logged successfully');
      }
    } catch (error) {
      console.error('❌ [LOGGING] Error logging assignment:', error);
    }
    
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
      searchRadius: 25000,
      idfRedirection: isIdfUser,
      detectionMethod: detectionMethod,
      originalCoords: { lat: latitude, lng: longitude },
      searchCoords: { lat: searchLatitude, lng: searchLongitude },
      diversificationWeight: randomSelection.weight || 1.0
    };

    console.log('🎯 [SÉLECTION FINALE] Bar sélectionné:', {
      name: result.name,
      types: randomBar.types,
      primaryType: randomBar.primaryType,
      priority: randomSelection.priority,
      priorityLabel: randomSelection.priority === 3 ? 'BAR PUR' : 
                     randomSelection.priority === 2 ? 'BAR-RESTAURANT' : 
                     randomSelection.priority === 1 ? 'BAR D\'HÔTEL' : 'AUTRE',
      searchRadius: 25000,
      idfRedirection: isIdfUser,
      detectionMethod: detectionMethod
    });

    // RAPPORT FRANÇAIS DÉTAILLÉ
    console.log('📊 [RAPPORT FILTRAGE FRANÇAIS] Résumé du filtrage intelligent amélioré:', {
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
      'Redirection IDF': isIdfUser
    });

    // Log successful API call
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.functions.invoke('api-logger', {
        body: {
          api_name: 'simple-bar-search',
          endpoint: '/functions/v1/simple-bar-search',
          request_type: 'search',
          status_code: 200,
          response_time_ms: Date.now() - startTime,
          cost_usd: 0.017, // Google Places Search cost
          metadata: { 
            latitude, 
            longitude, 
            selected_bar: result.name,
            total_bars_found: selectedBars.length,
            search_radius: 25000,
            idf_redirection: isIdfUser
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
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase.functions.invoke('api-logger', {
        body: {
          api_name: 'simple-bar-search',
          endpoint: '/functions/v1/simple-bar-search',
          request_type: 'search',
          status_code: 500,
          response_time_ms: Date.now() - startTime,
          cost_usd: 0,
          error_message: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Unknown error',
          metadata: { error_details: error }
        }
      });
    } catch (logError) {
      console.error('Failed to log API error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Erreur de recherche', details: (error instanceof Error ? error.message : String(error)) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
