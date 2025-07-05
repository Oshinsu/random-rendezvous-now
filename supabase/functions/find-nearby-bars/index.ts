
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Fonction de filtrage ASSOUPLIE pour trouver des bars uniquement
function isAuthenticBar(place: NewPlaceResult): boolean {
  console.log(`🔍 [BAR FILTER] Vérification: ${place.name}`);
  
  // ÉTAPE 1: Vérifier le type primaire - DOIT être 'bar'
  if (place.primaryType && place.primaryType !== 'bar') {
    console.log(`❌ [BAR FILTER] ${place.name}: Type primaire non-bar (${place.primaryType})`);
    return false;
  }
  
  // ÉTAPE 2: Business status - accepter OPERATIONAL ou undefined (plus permissif)
  if (place.businessStatus && place.businessStatus === 'CLOSED_PERMANENTLY') {
    console.log(`❌ [BAR FILTER] ${place.name}: Fermé définitivement`);
    return false;
  }
  
  // ÉTAPE 3: Ignorer l'état d'ouverture - on peut chercher des bars même fermés
  // (Les gens veulent voir les bars disponibles pour planifier)
  
  // ÉTAPE 4: Filtrage minimal par nom suspect
  const suspiciousKeywords = ['société', 'company'];
  const hasSuspiciousName = suspiciousKeywords.some(keyword => 
    place.name.toLowerCase().includes(keyword.toLowerCase())
  );
  if (hasSuspiciousName) {
    console.log(`❌ [BAR FILTER] ${place.name}: Nom suspect (${suspiciousKeywords.filter(k => place.name.toLowerCase().includes(k.toLowerCase())).join(', ')})`);
    return false;
  }
  
  console.log(`✅ [BAR FILTER] ${place.name}: Bar validé`);
  console.log(`   - Business Status: ${place.businessStatus || 'N/A'}`);
  console.log(`   - Primary Type: ${place.primaryType || 'N/A'}`);
  
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
  
  console.log(`🎲 [NEW API SELECTION] Sélection parmi ${barsToChooseFrom.length} bars (${decentBars.length} avec bonne note)`);
  
  // Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * barsToChooseFrom.length);
  const selectedBar = barsToChooseFrom[randomIndex];
  
  console.log(`🎯 [NEW API SELECTION] Bar sélectionné: ${selectedBar.name} (index ${randomIndex}/${barsToChooseFrom.length - 1})`);
  
  return selectedBar;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, radius = 5000 } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Recherche de bars authentiques près de:', { latitude, longitude, radius });
    
    // Utiliser la clé API depuis les secrets Supabase
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ Clé API Google Places manquante')
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

// Recherche Google Places API (New) v1 avec filtrage strict
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 Recherche Google Places API (New) v1 avec filtrage strict pour bars authentiques');

    const requestBody = {
      includedPrimaryTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: radius
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

    const data = await response.json();

    console.log('📊 Réponse Google Places API (New):', { 
      placeCount: data.places?.length,
      hasPlaces: !!data.places
    });

    if (!data.places || data.places.length === 0) {
      console.log('❌ Aucun établissement trouvé par Google Places API (New)');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun établissement trouvé dans cette zone',
          debug: {
            latitude,
            longitude,
            radius,
            newApiUsed: true
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // FILTRAGE ASSOUPLI : recherche de bars uniquement
    console.log('🔍 [BAR FILTRAGE] Application du filtrage assoupli pour bars uniquement...');
    
    const authenticBars = data.places.filter(isAuthenticBar);
    
    console.log(`📋 [BAR FILTRAGE] Résultats après filtrage: ${authenticBars.length}/${data.places.length} bars authentiques`);

    if (authenticBars.length === 0) {
      console.log('❌ Aucun bar authentique trouvé après filtrage');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone de 10km',
          debug: {
            totalFound: data.places.length,
            authenticBarsFound: authenticBars.length,
            newApiUsed: true,
            rejectedBars: data.places.map(bar => ({
              name: bar.name,
              primaryType: bar.primaryType,
              businessStatus: bar.businessStatus,
              suspiciousName: ['société', 'company'].some(keyword => 
                bar.name.toLowerCase().includes(keyword.toLowerCase())
              )
            }))
          }
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sélection ALÉATOIRE du bar authentique
    const selectedBar = selectRandomBarNewAPI(authenticBars);
    
    // Gestion de l'adresse pour New API
    const barAddress = selectedBar.formattedAddress || `Coordonnées: ${selectedBar.location.latitude.toFixed(4)}, ${selectedBar.location.longitude.toFixed(4)}`;
    
    // Validation et correction du mapping des données
    const barName = selectedBar.name || `Bar ${selectedBar.id.slice(-8)}`;
    const placeId = selectedBar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [DATA VALIDATION] Place ID invalide:', placeId);
      throw new Error('Place ID invalide reçu de l\'API');
    }
    
    if (!barName || barName.startsWith('places/')) {
      console.error('❌ [DATA VALIDATION] Nom de bar invalide:', barName);
      console.error('   - Raw selectedBar:', JSON.stringify(selectedBar, null, 2));
      throw new Error('Nom de bar invalide - possiblement un Place ID');
    }

    const result = {
      place_id: placeId,
      name: barName,
      formatted_address: barAddress,
      geometry: {
        location: {
          lat: selectedBar.location.latitude,
          lng: selectedBar.location.longitude
        }
      },
      rating: selectedBar.rating,
      price_level: selectedBar.priceLevel,
      types: selectedBar.types || [],
      businessStatus: selectedBar.businessStatus,
      openNow: selectedBar.currentOpeningHours?.openNow
    };
    
    console.log('🍺 Bar authentique sélectionné avec New API:', {
      name: result.name,
      address: result.formatted_address,
      rating: result.rating,
      businessStatus: result.businessStatus,
      openNow: result.openNow,
      primaryType: selectedBar.primaryType,
      location: result.geometry.location,
      totalOptions: authenticBars.length
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans find-nearby-bars:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur lors de la recherche de bars authentiques' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
