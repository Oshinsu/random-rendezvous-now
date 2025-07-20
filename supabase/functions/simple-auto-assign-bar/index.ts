
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction de filtrage SIMPLIFIÉE - Seulement bars/pubs/brasseries/restaurant-bars OUVERTS
const isValidBarOrPub = (place: any): boolean => {
  const types = place.types || [];
  const primaryType = place.primaryType || '';
  
  console.log('🔍 Analyse du lieu:', {
    name: place.displayName?.text,
    types: types,
    primaryType: primaryType,
    openNow: place.currentOpeningHours?.openNow
  });

  // Vérifier si c'est ouvert (OBLIGATOIRE)
  if (place.currentOpeningHours && place.currentOpeningHours.openNow === false) {
    console.log('❌ Fermé - rejeté');
    return false;
  }

  // Types acceptés : bar, pub, brewery
  const acceptedTypes = ['bar', 'pub', 'brewery'];
  const hasAcceptedType = acceptedTypes.some(type => 
    types.includes(type) || primaryType === type
  );

  if (hasAcceptedType) {
    console.log('✅ Bar/Pub/Brasserie accepté');
    return true;
  }

  // Restaurant avec bar (doit avoir 'bar' ET 'restaurant' dans les types)
  const hasBarType = types.includes('bar') || primaryType === 'bar';
  const hasRestaurantType = types.includes('restaurant') || primaryType === 'restaurant';
  
  if (hasBarType && hasRestaurantType) {
    console.log('✅ Restaurant-bar accepté');
    return true;
  }

  console.log('❌ Ne correspond pas aux critères');
  return false;
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

    // Coordonnées OBLIGATOIRES
    if (!latitude || !longitude) {
      console.error('❌ Coordonnées manquantes');
      return new Response(
        JSON.stringify({ success: false, error: 'Coordonnées requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔍 Recherche de bars à:', { latitude, longitude });

    // Si ce n'est pas une recherche manuelle, vérifier l'éligibilité du groupe
    if (!manual_search && group_id) {
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

    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    const requestBody = {
      includedTypes: ["bar", "pub", "brewery", "restaurant"],
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: 10000
        }
      },
      maxResultCount: 20,
      languageCode: "fr-FR"
    };

    console.log('🌐 Appel API Google Places...');
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.currentOpeningHours,places.types,places.primaryType'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log('📊 Réponse API:', { placesCount: data.places?.length || 0 });

    if (!data.places || data.places.length === 0) {
      console.log('❌ Aucun lieu trouvé par Google Places');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun établissement trouvé dans cette zone' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filtrer selon nos critères simplifiés
    const validBars = data.places.filter(isValidBarOrPub);
    console.log('🍺 Bars valides trouvés:', validBars.length);

    if (validBars.length === 0) {
      console.log('❌ Aucun bar/pub ouvert trouvé');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun bar ou pub ouvert trouvé dans cette zone' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sélection aléatoire
    const selectedBar = validBars[Math.floor(Math.random() * validBars.length)];
    
    const result = {
      success: true,
      bar: {
        place_id: selectedBar.id,
        name: selectedBar.displayName?.text || `Bar ${selectedBar.id.slice(-8)}`,
        formatted_address: selectedBar.formattedAddress || 'Adresse non disponible',
        geometry: {
          location: {
            lat: selectedBar.location.latitude,
            lng: selectedBar.location.longitude
          }
        }
      }
    };

    console.log('🏆 Bar sélectionné:', result.bar.name);
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
