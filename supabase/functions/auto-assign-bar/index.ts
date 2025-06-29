
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

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  price_level?: number;
  types?: string[];
}

interface GooglePlacesResponse {
  results: PlaceResult[];
  status: string;
}

// ENHANCED: Types d'établissements à EXCLURE (pas des bars authentiques)
const EXCLUDED_TYPES = [
  'lodging', 'hotel', 'resort', 'guest_house', 'hostel',
  'restaurant', 'food', 'meal_takeaway', 'meal_delivery',
  'night_club', 'casino', 
  'store', 'shopping_mall', 'convenience_store', 'supermarket', 'department_store',
  'gas_station', 'car_dealer', 'car_rental', 'car_repair',
  'pharmacy', 'hospital', 'dentist', 'doctor',
  'bank', 'atm', 'finance',
  'gym', 'spa', 'beauty_salon', 'hair_care',
  'school', 'university', 'library'
];

// ENHANCED: Mots-clés suspects dans les noms
const SUSPICIOUS_KEYWORDS = [
  'vape', 'vapor', 'smoke', 'smoking', 'tobacco', 'cigarette', 'cigar',
  'hotel', 'restaurant', 'resto', 'café', 'coffee',
  'shop', 'store', 'market', 'pharmacy', 'hospital',
  'gas', 'station', 'fuel', 'petrol'
];

// Fonction STRICTE pour vérifier si un établissement est un bar authentique
function isAuthenticBar(place: PlaceResult): boolean {
  if (!place.types || place.types.length === 0) {
    console.log(`⚠️ [FILTER] ${place.name}: Aucun type défini`);
    return false;
  }

  // ÉTAPE 1: DOIT avoir 'bar' dans ses types
  const hasBarType = place.types.includes('bar');
  if (!hasBarType) {
    console.log(`❌ [FILTER] ${place.name}: N'a pas le type 'bar'`);
    return false;
  }

  // ÉTAPE 2: NE DOIT PAS avoir de types exclus
  const hasExcludedType = place.types.some(type => EXCLUDED_TYPES.includes(type));
  if (hasExcludedType) {
    const excludedFound = place.types.filter(type => EXCLUDED_TYPES.includes(type));
    console.log(`❌ [FILTER] ${place.name}: Contient des types exclus: ${excludedFound.join(', ')}`);
    return false;
  }

  // ÉTAPE 3: NE DOIT PAS avoir de mots-clés suspects dans le nom
  const hasSuspiciousName = SUSPICIOUS_KEYWORDS.some(keyword => 
    place.name.toLowerCase().includes(keyword.toLowerCase())
  );
  if (hasSuspiciousName) {
    const suspiciousFound = SUSPICIOUS_KEYWORDS.filter(keyword => 
      place.name.toLowerCase().includes(keyword.toLowerCase())
    );
    console.log(`❌ [FILTER] ${place.name}: Nom suspect (${suspiciousFound.join(', ')})`);
    return false;
  }
  
  console.log(`✅ [FILTER] ${place.name}: Bar authentique validé (types: ${place.types.join(', ')})`);
  return true;
}

// Fonction de sélection ALÉATOIRE améliorée
function selectRandomBar(bars: PlaceResult[]): PlaceResult {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  // Filtrer les bars avec une note décente (≥ 3.0) si disponible
  const decentBars = bars.filter(bar => !bar.rating || bar.rating >= 3.0);
  const barsToChooseFrom = decentBars.length > 0 ? decentBars : bars;
  
  console.log(`🎲 [AUTO-ASSIGN] Sélection parmi ${barsToChooseFrom.length} bars (${decentBars.length} avec bonne note)`);
  
  // Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * barsToChooseFrom.length);
  const selectedBar = barsToChooseFrom[randomIndex];
  
  console.log(`🎯 [AUTO-ASSIGN] Bar sélectionné: ${selectedBar.name} (index ${randomIndex}/${barsToChooseFrom.length - 1})`);
  
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

    // Recherche Google Places avec type=bar UNIQUEMENT
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${searchLatitude},${searchLongitude}&radius=8000&type=bar&key=${apiKey}`;
    
    console.log('🌐 [AUTO-ASSIGN-BAR] Recherche Google Places (type=bar UNIQUEMENT)');

    const response = await fetch(searchUrl);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.log('❌ [AUTO-ASSIGN-BAR] Aucun établissement trouvé');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun établissement trouvé dans cette zone'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // FILTRAGE STRICT RENFORCÉ : ne garder que les bars 100% authentiques
    console.log('🔍 [AUTO-ASSIGN-BAR] Application du filtre STRICT RENFORCÉ pour bars authentiques...');
    console.log(`📋 [AUTO-ASSIGN-BAR] ${EXCLUDED_TYPES.length} types exclus, ${SUSPICIOUS_KEYWORDS.length} mots-clés suspects`);
    
    const authenticBars = data.results.filter(isAuthenticBar);
    
    console.log(`📋 [AUTO-ASSIGN-BAR] Résultats après filtrage strict: ${authenticBars.length}/${data.results.length} bars authentiques`);

    if (authenticBars.length === 0) {
      console.log('❌ [AUTO-ASSIGN-BAR] Aucun bar authentique trouvé après filtrage strict');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun bar authentique trouvé dans cette zone',
        debug: {
          totalFound: data.results.length,
          authenticBarsFound: authenticBars.length,
          excludedTypes: EXCLUDED_TYPES,
          suspiciousKeywords: SUSPICIOUS_KEYWORDS,
          rejectedBars: data.results.map(bar => ({
            name: bar.name,
            types: bar.types,
            hasBar: bar.types?.includes('bar'),
            hasExcluded: bar.types?.some(type => EXCLUDED_TYPES.includes(type)),
            hasSuspicious: SUSPICIOUS_KEYWORDS.some(keyword => 
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

    // Sélection ALÉATOIRE du meilleur bar authentique
    const selectedBar = selectRandomBar(authenticBars);

    // Réponse standardisée
    const result: StandardResponse = {
      success: true,
      bar: {
        place_id: selectedBar.place_id,
        name: selectedBar.name,
        formatted_address: selectedBar.formatted_address || selectedBar.vicinity || `Coordonnées: ${selectedBar.geometry.location.lat.toFixed(4)}, ${selectedBar.geometry.location.lng.toFixed(4)}`,
        geometry: selectedBar.geometry,
        rating: selectedBar.rating
      }
    };

    console.log('✅ [AUTO-ASSIGN-BAR] Bar authentique sélectionné ALÉATOIREMENT:', {
      name: result.bar?.name,
      totalOptions: authenticBars.length
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
