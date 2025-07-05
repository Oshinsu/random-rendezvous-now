
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interface standardisée pour les réponses
interface StandardResponse {
  success: boolean;
  bar?: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
  };
  error?: string;
  debug?: any;
}

interface NewPlaceResult {
  id: string;
  name: string;
  formattedAddress?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  priceLevel?: string;
  primaryType?: string;
  types?: string[];
  businessStatus?: string;
  currentOpeningHours?: {
    openNow?: boolean;
  };
}

interface NewGooglePlacesResponse {
  places: NewPlaceResult[];
}

// Fonction de filtrage SIMPLIFIÉE pour New API - plus strict avec business status
function isAuthenticOpenBar(place: NewPlaceResult): boolean {
  console.log(`🔍 [AUTO-ASSIGN NEW API FILTER] Vérification: ${place.name}`);
  
  // ÉTAPE 1: Vérifier business status - DOIT être opérationnel
  if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
    console.log(`❌ [AUTO-ASSIGN NEW API FILTER] ${place.name}: Business status non opérationnel (${place.businessStatus})`);
    return false;
  }
  
  // ÉTAPE 2: Vérifier si ouvert maintenant si l'info est disponible
  if (place.currentOpeningHours && place.currentOpeningHours.openNow === false) {
    console.log(`❌ [AUTO-ASSIGN NEW API FILTER] ${place.name}: Fermé actuellement`);
    return false;
  }
  
  // ÉTAPE 3: Vérifier le type primaire (devrait être 'bar' avec new API)
  if (place.primaryType && place.primaryType !== 'bar') {
    console.log(`❌ [AUTO-ASSIGN NEW API FILTER] ${place.name}: Type primaire non-bar (${place.primaryType})`);
    return false;
  }
  
  // ÉTAPE 4: Filtrage par nom suspect (réduit car New API est plus précis)
  const suspiciousKeywords = ['event', 'société', 'company', 'traiteur', 'catering'];
  const hasSuspiciousName = suspiciousKeywords.some(keyword => 
    place.name.toLowerCase().includes(keyword.toLowerCase())
  );
  if (hasSuspiciousName) {
    const suspiciousFound = suspiciousKeywords.filter(keyword => 
      place.name.toLowerCase().includes(keyword.toLowerCase())
    );
    console.log(`❌ [AUTO-ASSIGN NEW API FILTER] ${place.name}: Nom suspect pour événementiel (${suspiciousFound.join(', ')})`);
    return false;
  }
  
  console.log(`✅ [AUTO-ASSIGN NEW API FILTER] ${place.name}: Bar authentique et ouvert validé`);
  console.log(`   - Business Status: ${place.businessStatus || 'N/A'}`);
  console.log(`   - Primary Type: ${place.primaryType || 'N/A'}`);
  console.log(`   - Open Now: ${place.currentOpeningHours?.openNow ?? 'N/A'}`);
  
  return true;
}

// Fonction de sélection ALÉATOIRE améliorée pour New API
function selectRandomBarNewAPI(bars: NewPlaceResult[]): NewPlaceResult {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  // Filtrer les bars avec une note décente (≥ 3.0) si disponible
  const decentBars = bars.filter(bar => !bar.rating || bar.rating >= 3.0);
  const barsToChooseFrom = decentBars.length > 0 ? decentBars : bars;
  
  console.log(`🎲 [AUTO-ASSIGN NEW API SELECTION] Sélection parmi ${barsToChooseFrom.length} bars (${decentBars.length} avec bonne note)`);
  
  // Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * barsToChooseFrom.length);
  const selectedBar = barsToChooseFrom[randomIndex];
  
  console.log(`🎯 [AUTO-ASSIGN NEW API SELECTION] Bar sélectionné: ${selectedBar.name} (index ${randomIndex}/${barsToChooseFrom.length - 1})`);
  
  return selectedBar;
}

// Validation stricte des coordonnées
function validateCoordinatesStrict(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { group_id, latitude, longitude } = await req.json()

    // Validation stricte des paramètres d'entrée
    if (!group_id) {
      const errorResponse: StandardResponse = {
        success: false,
        error: 'group_id est requis'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🤖 [AUTO-ASSIGN-BAR] Démarrage attribution pour groupe:', group_id);

    // Coordonnées avec fallback sécurisé sur Paris
    const searchLatitude = latitude && validateCoordinatesStrict(latitude, longitude) ? latitude : 48.8566;
    const searchLongitude = longitude && validateCoordinatesStrict(latitude, longitude) ? longitude : 2.3522;

    if (!validateCoordinatesStrict(searchLatitude, searchLongitude)) {
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Coordonnées invalides après validation'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📍 [AUTO-ASSIGN-BAR] Recherche avec coordonnées validées:', { 
      lat: searchLatitude, 
      lng: searchLongitude 
    });

    // Vérification de l'éligibilité du groupe AVANT la recherche
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, latitude, longitude, current_participants, status, bar_name, bar_place_id')
      .eq('id', group_id)
      .single();

    if (groupError || !group) {
      console.error('❌ [AUTO-ASSIGN-BAR] Groupe introuvable:', groupError);
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Groupe introuvable'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifications d'éligibilité STRICTES
    const isEligible = (
      group.current_participants === 5 &&
      group.status === 'confirmed' &&
      !group.bar_name &&
      !group.bar_place_id
    );

    if (!isEligible) {
      console.log('ℹ️ [AUTO-ASSIGN-BAR] Groupe non éligible:', {
        participants: group.current_participants,
        status: group.status,
        hasBar: !!group.bar_name,
        hasPlaceId: !!group.bar_place_id
      });
      
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Groupe non éligible pour attribution automatique'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recherche de bars authentiques avec Google Places
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ [AUTO-ASSIGN-BAR] Clé API Google Places manquante')
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Configuration API manquante'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Recherche Google Places API (New) v1 avec filtrage strict
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 [AUTO-ASSIGN-BAR] Recherche Google Places API (New) v1 avec filtrage strict pour bars authentiques');

    const requestBody = {
      includedPrimaryTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: searchLatitude,
            longitude: searchLongitude
          },
          radius: 8000
        }
      },
      rankPreference: "DISTANCE",
      maxResultCount: 20,
      languageCode: "fr"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.name,places.formattedAddress,places.location,places.rating,places.priceLevel,places.primaryType,places.types,places.businessStatus,places.currentOpeningHours'
      },
      body: JSON.stringify(requestBody)
    });

    const data: NewGooglePlacesResponse = await response.json();

    if (!data.places || data.places.length === 0) {
      console.log('❌ [AUTO-ASSIGN-BAR] Aucun établissement trouvé par Google Places API (New)');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun établissement trouvé dans cette zone'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // FILTRAGE SIMPLIFIÉ avec New API : plus strict sur business status et ouverture
    console.log('🔍 [AUTO-ASSIGN-BAR] Application du filtrage optimisé pour New API...');
    
    const authenticOpenBars = data.places.filter(isAuthenticOpenBar);
    
    console.log(`📋 [AUTO-ASSIGN-BAR] Résultats après filtrage: ${authenticOpenBars.length}/${data.places.length} bars authentiques ouverts`);

    if (authenticOpenBars.length === 0) {
      console.log('❌ [AUTO-ASSIGN-BAR] Aucun bar authentique ouvert trouvé après filtrage New API');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun bar authentique ouvert trouvé dans cette zone',
        debug: {
          totalFound: data.places.length,
          authenticBarsFound: authenticOpenBars.length,
          newApiUsed: true,
          rejectedBars: data.places.map(bar => ({
            name: bar.name,
            primaryType: bar.primaryType,
            businessStatus: bar.businessStatus,
            openNow: bar.currentOpeningHours?.openNow,
            suspiciousName: ['event', 'société', 'company', 'traiteur', 'catering'].some(keyword => 
              bar.name.toLowerCase().includes(keyword.toLowerCase())
            )
          }))
        }
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sélection ALÉATOIRE du meilleur bar authentique ouvert
    const selectedBar = selectRandomBarNewAPI(authenticOpenBars);

    // Validation et correction du mapping des données
    const barName = selectedBar.name || `Bar ${selectedBar.id.slice(-8)}`;
    const placeId = selectedBar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [AUTO-ASSIGN DATA VALIDATION] Place ID invalide:', placeId);
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Place ID invalide reçu de l\'API'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!barName || barName.startsWith('places/')) {
      console.error('❌ [AUTO-ASSIGN DATA VALIDATION] Nom de bar invalide:', barName);
      console.error('   - Raw selectedBar:', JSON.stringify(selectedBar, null, 2));
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Nom de bar invalide - possiblement un Place ID'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Réponse standardisée pour New API
    const result: StandardResponse = {
      success: true,
      bar: {
        place_id: placeId,
        name: barName,
        formatted_address: selectedBar.formattedAddress || `Coordonnées: ${selectedBar.location.latitude.toFixed(4)}, ${selectedBar.location.longitude.toFixed(4)}`,
        geometry: {
          location: {
            lat: selectedBar.location.latitude,
            lng: selectedBar.location.longitude
          }
        },
        rating: selectedBar.rating
      }
    };

    console.log('✅ [AUTO-ASSIGN-BAR] Bar authentique sélectionné avec New API:', {
      name: result.bar?.name,
      businessStatus: selectedBar.businessStatus,
      primaryType: selectedBar.primaryType,
      openNow: selectedBar.currentOpeningHours?.openNow,
      totalOptions: authenticOpenBars.length
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [AUTO-ASSIGN-BAR] Erreur globale:', error);
    const errorResponse: StandardResponse = {
      success: false,
      error: 'Erreur serveur lors de l\'attribution automatique',
      debug: error.message
    };
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
