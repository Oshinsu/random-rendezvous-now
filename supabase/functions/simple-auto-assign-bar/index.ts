
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage HARMONISÉE avec priorités clairement définies
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { group_id, latitude, longitude, manual_search } = await req.json()

    // Validation des coordonnées - OBLIGATOIRES
    if (!latitude || !longitude) {
      console.error('❌ Coordonnées manquantes:', { latitude, longitude });
      return new Response(
        JSON.stringify({ success: false, error: 'Coordonnées requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (manual_search) {
      console.log('🔍 [RECHERCHE MANUELLE] Coordonnées:', { latitude, longitude });
    } else {
      if (!group_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'group_id requis pour attribution automatique' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🤖 [AUTO-ASSIGN] Attribution pour:', group_id);

      // Vérifier l'éligibilité du groupe
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, status, bar_name')
        .eq('id', group_id)
        .single()

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
    }

    // API Google Places
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuration manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Recherche avec rayon 10km pour:', { latitude, longitude });

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub", "brewery"],
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
      console.log('❌ ÉCHEC TOTAL - Aucun lieu trouvé par l\'API');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun établissement trouvé dans cette zone' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    console.log('🍺 Bars valides après analyse complète:', analyzedBars.length);

    // FALLBACK pour recherche manuelle SEULEMENT
    let selectedBars = analyzedBars;
    let fallbackUsed = false;
    
    if (analyzedBars.length === 0 && manual_search) {
      console.log('⚠️ FALLBACK MANUEL - Utilisation de tous les lieux ouverts');
      selectedBars = openBars.map(place => ({
        place,
        isValid: true,
        priority: 10,
        reason: 'Fallback manuel'
      }));
      fallbackUsed = true;
    }

    if (selectedBars.length === 0) {
      console.log('❌ ÉCHEC FINAL - Aucun bar/pub/brasserie valide trouvé');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun bar, pub ou brasserie valide trouvé dans cette zone' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Trier par priorité décroissante puis sélection aléatoire dans la meilleure catégorie
    selectedBars.sort((a, b) => b.priority - a.priority);
    const bestPriority = selectedBars[0].priority;
    const bestBars = selectedBars.filter(bar => bar.priority === bestPriority);
    
    const selectedBar = bestBars[Math.floor(Math.random() * bestBars.length)];
    
    const result = {
      success: true,
      bar: {
        place_id: selectedBar.place.id,
        name: selectedBar.place.displayName?.text || `Bar ${selectedBar.place.id.slice(-8)}`,
        formatted_address: selectedBar.place.formattedAddress || 'Adresse non disponible',
        geometry: {
          location: {
            lat: selectedBar.place.location.latitude,
            lng: selectedBar.place.location.longitude
          }
        },
        rating: selectedBar.place.rating || null
      }
    };

    console.log('🏆 Bar sélectionné:', result.bar.name, '- Priorité:', bestPriority, '- Note:', result.bar.rating);
    console.log('📊 STATS FINALES - Total:', data.places.length, 'Ouverts:', openBars.length, 'Valides:', analyzedBars.length, 'Priorité max:', bestPriority);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur lors de l\'attribution' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
