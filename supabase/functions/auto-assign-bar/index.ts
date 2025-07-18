
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
  displayName?: {
    text: string;
    languageCode?: string;
  };
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

// Extraction ROBUSTE du nom du bar avec système de fallback
function extractBarName(place: NewPlaceResult): string {
  console.log('🔍 [NAME EXTRACTION] Données complètes du bar:', JSON.stringify(place, null, 2));

  // Priorité 1: displayName.text (le plus fiable)
  if (place.displayName?.text && !place.displayName.text.startsWith('places/') && !place.displayName.text.startsWith('ChIJ')) {
    console.log('✅ [NAME EXTRACTION] Utilisation displayName.text:', place.displayName.text);
    return place.displayName.text;
  }

  // Priorité 2: name (si ce n'est pas un Place ID)
  if (place.name && !place.name.startsWith('places/') && !place.name.startsWith('ChIJ')) {
    console.log('✅ [NAME EXTRACTION] Utilisation name:', place.name);
    return place.name;
  }

  // Priorité 3: Fallback sur adresse formatée
  if (place.formattedAddress) {
    const addressParts = place.formattedAddress.split(',');
    const possibleName = addressParts[0].trim();
    if (possibleName && possibleName.length > 2) {
      console.log('⚠️ [NAME EXTRACTION] Utilisation adresse comme nom:', possibleName);
      return possibleName;
    }
  }

  // Priorité 4: Nom générique basé sur l'ID
  const fallbackName = `Bar ${place.id.slice(-8)}`;
  console.log('⚠️ [NAME EXTRACTION] Utilisation nom générique:', fallbackName);
  return fallbackName;
}

// Sélection SIMPLE du premier bar - pas de filtrage complexe
function selectFirstBar(bars: NewPlaceResult[]): NewPlaceResult {
  if (bars.length === 0) {
    throw new Error('Aucun bar disponible pour la sélection');
  }

  const selectedBar = bars[0];
  console.log(`🎯 [AUTO-ASSIGN SIMPLE SELECTION] Premier bar sélectionné: ${selectedBar.name}`);
  
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

    // Recherche Google Places API (New) v1 avec enrichissement des données
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 [AUTO-ASSIGN-BAR] Recherche Google Places API (New) v1 avec enrichissement des données');

    const requestBody = {
      includedTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: searchLatitude,
            longitude: searchLongitude
          },
          radius: 10000 // 10km radius
        }
      },
      rankPreference: "DISTANCE",
      maxResultCount: 20,
      languageCode: "fr-FR"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.name,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.primaryType,places.types,places.businessStatus,places.currentOpeningHours'
      },
      body: JSON.stringify(requestBody)
    });

    const data: NewGooglePlacesResponse = await response.json();

    if (!data.places || data.places.length === 0) {
      console.log('❌ [AUTO-ASSIGN-BAR] Aucun bar trouvé par Google Places API (New)');
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Aucun bar trouvé dans cette zone'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [AUTO-ASSIGN-BAR] Bars trouvés - recherche exclusivement sur type "bar"');
    console.log(`📋 [AUTO-ASSIGN-BAR] ${data.places.length} bars trouvés par Google Places API`);

    // Sélection du PREMIER bar trouvé
    const selectedBar = selectFirstBar(data.places);

    // Extraction robuste du nom avec système de fallback
    const barName = extractBarName(selectedBar);
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
    
    // Validation finale du nom extrait
    if (!barName || barName.startsWith('places/') || barName.startsWith('ChIJ')) {
      console.error('❌ [AUTO-ASSIGN DATA VALIDATION] Nom de bar invalide après extraction:', barName);
      console.error('   - Raw selectedBar:', JSON.stringify(selectedBar, null, 2));
      const errorResponse: StandardResponse = {
        success: false,
        error: 'Impossible d\'extraire un nom de bar valide'
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Réponse standardisée avec nom robuste
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

    console.log('✅ [AUTO-ASSIGN-BAR] Bar sélectionné avec extraction robuste du nom:', {
      extractedName: result.bar?.name,
      displayName: selectedBar.displayName?.text,
      originalName: selectedBar.name,
      businessStatus: selectedBar.businessStatus,
      primaryType: selectedBar.primaryType,
      openNow: selectedBar.currentOpeningHours?.openNow,
      types: selectedBar.types?.join(', ') || 'N/A',
      totalOptions: data.places.length
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
