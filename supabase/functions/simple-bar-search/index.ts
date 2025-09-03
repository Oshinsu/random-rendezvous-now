import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    console.log('🔍 [RECHERCHE INTELLIGENTE AMÉLIORÉE] Début avec filtrage renforcé:', { latitude, longitude });

    // NOUVEAU SYSTÈME DE FALLBACK INTELLIGENT
    let selectedBars = [];
    let searchRadius = 12000; // Rayon initial augmenté
    let fallbackLevel = 0;

    // NIVEAU 1: Recherche normale avec rayon initial
    console.log('🎯 [FALLBACK NIVEAU 1] Recherche normale avec rayon 12km');
    let allPlaces = await searchBarsWithRadius(latitude, longitude, searchRadius, apiKey);
    
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

    // NIVEAU 2: Expansion du rayon de recherche
    if (fallbackLevel >= 1 && selectedBars.length === 0) {
      console.log('🎯 [FALLBACK NIVEAU 2] Expansion du rayon à 15km');
      searchRadius = 15000;
      allPlaces = await searchBarsWithRadius(latitude, longitude, searchRadius, apiKey);
      
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
      console.log('🎯 [FALLBACK NIVEAU 3] Expansion du rayon à 25km (dernier recours)');
      searchRadius = 25000;
      allPlaces = await searchBarsWithRadius(latitude, longitude, searchRadius, apiKey);
      
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
    
    // Sélection aléatoire parmi les bars de plus haute priorité
    const randomSelection = topPriorityBars[Math.floor(Math.random() * topPriorityBars.length)];
    const randomBar = randomSelection.bar;
    
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

    console.log('🎯 [SÉLECTION FINALE] Bar sélectionné:', {
      name: result.name,
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
      'Niveau de fallback': fallbackLevel,
      'Rayon de recherche': `${searchRadius/1000}km`
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
          error_message: error instanceof Error ? error.message : 'Unknown error',
          metadata: { error_details: error }
        }
      });
    } catch (logError) {
      console.error('Failed to log API error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Erreur de recherche', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
