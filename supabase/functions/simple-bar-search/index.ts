
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage HARMONISÉE - identique à simple-auto-assign-bar mais avec fallback
const isRealBarOrPub = (place: any): { isValid: boolean; priority: number; reason: string } => {
  const name = place.displayName?.text?.toLowerCase() || '';
  const address = place.formattedAddress?.toLowerCase() || '';
  const types = place.types || [];
  const primaryType = place.primaryType || '';
  const rating = place.rating || 0;

  console.log('🔍 Analyse du lieu:', {
    name: place.displayName?.text,
    types: types,
    primaryType: primaryType,
    rating: rating
  });

  // Seuil de note abaissé à 3.0 (au lieu de 4.0)
  if (rating > 0 && rating < 3.0) {
    console.log('❌ Lieu rejeté - note trop faible:', rating);
    return { isValid: false, priority: 0, reason: `Note trop faible: ${rating}` };
  }

  // PRIORITÉ 1 : Vrais bars et pubs (score 100)
  const isBarOrPub = types.includes('bar') || types.includes('pub') || 
                     primaryType === 'bar' || primaryType === 'pub';
  
  if (isBarOrPub) {
    console.log('✅ PRIORITÉ 1 - Vrai bar/pub détecté');
    return { isValid: true, priority: 100, reason: 'Bar/pub authentique' };
  }

  // PRIORITÉ 2 : Brasseries (score 80)
  const isBrasserie = name.includes('brasserie') || types.includes('brewery') || 
                      name.includes('brewery');
  
  if (isBrasserie) {
    console.log('✅ PRIORITÉ 2 - Brasserie acceptée');
    return { isValid: true, priority: 80, reason: 'Brasserie' };
  }

  // PRIORITÉ 3 : Restaurant-bars avec critères stricts (score 60)
  const hasBarType = types.includes('bar');
  const restaurantTypes = types.filter(type => ['restaurant', 'meal_takeaway', 'food'].includes(type));
  const isRestaurantBar = hasBarType && restaurantTypes.length <= 2;

  if (isRestaurantBar) {
    console.log('✅ PRIORITÉ 3 - Restaurant-bar accepté');
    return { isValid: true, priority: 60, reason: 'Restaurant avec bar' };
  }

  // Types explicitement INTERDITS
  const bannedTypes = [
    'cafe', 'bakery', 'grocery_or_supermarket', 'convenience_store',
    'gas_station', 'lodging', 'hospital', 'pharmacy', 'school',
    'university', 'church', 'mosque', 'synagogue', 'temple',
    'hotel'
  ];

  const hasBannedType = bannedTypes.some(type => types.includes(type)) || 
                        bannedTypes.includes(primaryType);
  
  if (hasBannedType) {
    console.log('❌ Lieu rejeté - type interdit détecté');
    return { isValid: false, priority: 0, reason: 'Type interdit' };
  }

  // Mots-clés strictement INTERDITS
  const bannedKeywords = [
    'mcdo', 'kfc', 'subway', 'quick', 'domino', 'pizza hut',
    'hôtel', 'hotel', 'resort', 'camping', 'supermarché', 'épicerie',
    'magasin', 'pharmacie', 'école', 'hôpital', 'église', 'temple'
  ];

  const hasBannedKeyword = bannedKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  );

  if (hasBannedKeyword) {
    console.log('❌ Lieu rejeté - mot-clé interdit trouvé');
    return { isValid: false, priority: 0, reason: 'Mot-clé interdit' };
  }

  console.log('❌ Lieu rejeté - ne correspond à aucun critère accepté');
  return { isValid: false, priority: 0, reason: 'Aucun critère accepté' };
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

    console.log('🔍 Recherche HARMONISÉE de bars près de:', { latitude, longitude });

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub", "brewery"], // SANS night_club, AVEC brewery
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 10000
        }
      },
      maxResultCount: 20,
      languageCode: "fr-FR"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.regularOpeningHours,places.types,places.primaryType,places.rating'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun lieu trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📊 Lieux trouvés initialement:', data.places.length);

    // Filtrer les lieux ouverts
    const openBars = data.places.filter(place => {
      const currentHours = place.currentOpeningHours;
      if (currentHours && currentHours.openNow !== undefined) {
        return currentHours.openNow === true;
      }
      return true;
    });

    console.log('🕐 Lieux ouverts:', openBars.length);

    // Analyse avec priorités
    const analyzedBars = openBars.map(place => {
      const analysis = isRealBarOrPub(place);
      return {
        place,
        ...analysis
      };
    }).filter(item => item.isValid);

    console.log('🍺 Bars valides après analyse:', analyzedBars.length);

    // FALLBACK pour recherche manuelle : si aucun bar valide, utiliser tous les ouverts
    let selectedBars = analyzedBars;
    let fallbackUsed = false;
    
    if (analyzedBars.length === 0) {
      console.log('⚠️ FALLBACK MANUEL - Utilisation de tous les lieux ouverts');
      selectedBars = openBars.map(place => ({
        place,
        isValid: true,
        priority: 10, // Priorité faible
        reason: 'Fallback manuel'
      }));
      fallbackUsed = true;
    }

    if (selectedBars.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucun établissement ouvert trouvé' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sélection avec priorités
    selectedBars.sort((a, b) => b.priority - a.priority);
    const bestPriority = selectedBars[0].priority;
    const bestBars = selectedBars.filter(bar => bar.priority === bestPriority);
    
    const randomBar = bestBars[Math.floor(Math.random() * bestBars.length)];
    
    const result = {
      place_id: randomBar.place.id,
      name: randomBar.place.displayName?.text || `Bar ${randomBar.place.id.slice(-8)}`,
      formatted_address: randomBar.place.formattedAddress || 'Adresse non disponible',
      geometry: {
        location: {
          lat: randomBar.place.location.latitude,
          lng: randomBar.place.location.longitude
        }
      },
      rating: randomBar.place.rating || null
    };

    console.log('🎲 Bar sélectionné:', result.name, 
                '- Priorité:', bestPriority, 
                '- Note:', result.rating,
                fallbackUsed ? '(FALLBACK)' : '');
    console.log('📊 Stats finales - Total:', data.places.length, 'Ouverts:', openBars.length, 'Valides:', analyzedBars.length);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur de recherche' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
