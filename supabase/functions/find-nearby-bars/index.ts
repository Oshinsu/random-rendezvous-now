
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

// Fonction de filtrage SIMPLIFIÉE pour New API - plus strict avec business status
function isAuthenticOpenBar(place: NewPlaceResult): boolean {
  console.log(`🔍 [NEW API FILTER] Vérification: ${place.name}`);
  
  // ÉTAPE 1: Vérifier business status - DOIT être opérationnel
  if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
    console.log(`❌ [NEW API FILTER] ${place.name}: Business status non opérationnel (${place.businessStatus})`);
    return false;
  }
  
  // ÉTAPE 2: Vérifier si ouvert maintenant si l'info est disponible
  if (place.currentOpeningHours && place.currentOpeningHours.openNow === false) {
    console.log(`❌ [NEW API FILTER] ${place.name}: Fermé actuellement`);
    return false;
  }
  
  // ÉTAPE 3: Vérifier le type primaire (devrait être 'bar' avec new API)
  if (place.primaryType && place.primaryType !== 'bar') {
    console.log(`❌ [NEW API FILTER] ${place.name}: Type primaire non-bar (${place.primaryType})`);
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
    console.log(`❌ [NEW API FILTER] ${place.name}: Nom suspect pour événementiel (${suspiciousFound.join(', ')})`);
    return false;
  }
  
  console.log(`✅ [NEW API FILTER] ${place.name}: Bar authentique et ouvert validé`);
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

    // FILTRAGE SIMPLIFIÉ avec New API : plus strict sur business status et ouverture
    console.log('🔍 [NEW API FILTRAGE] Application du filtrage optimisé pour New API...');
    
    const authenticOpenBars = data.places.filter(isAuthenticOpenBar);
    
    console.log(`📋 [NEW API FILTRAGE] Résultats après filtrage: ${authenticOpenBars.length}/${data.places.length} bars authentiques ouverts`);

    if (authenticOpenBars.length === 0) {
      console.log('❌ Aucun bar authentique ouvert trouvé après filtrage New API');
      return new Response(
        JSON.stringify({ 
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
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sélection ALÉATOIRE du bar authentique ouvert
    const selectedBar = selectRandomBarNewAPI(authenticOpenBars);
    
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
      totalOptions: authenticOpenBars.length
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
