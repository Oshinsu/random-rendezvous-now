
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewPlaceResult {
  id: string;
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

interface BarValidationResult {
  isValid: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Service de validation stricte des bars (version Edge Function)
 */
class StrictBarValidator {
  // Mots-clés interdits (services non-bar)
  private static readonly FORBIDDEN_KEYWORDS = [
    'service', 'services', 'bureau', 'office', 'entreprise', 'company', 'société',
    'magasin', 'boutique', 'shop', 'store', 'pharmacie', 'pharmacy', 'clinique',
    'clinic', 'médical', 'medical', 'hôtel', 'hotel', 'restaurant', 'école', 
    'school', 'université', 'university', 'banque', 'bank', 'assurance', 
    'insurance', 'immobilier', 'real estate', 'garage', 'station', 'supermarché', 
    'supermarket', 'centre commercial', 'shopping center', 'église', 'church',
    'dental', 'hospital', 'market', 'mall', 'center', 'centre', 'temple',
    'mosque', 'automotive', 'repair', 'finance', 'legal', 'lawyer'
  ];

  // Mots-clés obligatoires pour les bars
  private static readonly REQUIRED_BAR_KEYWORDS = [
    'bar', 'pub', 'tavern', 'taverne', 'bistro', 'brasserie', 'lounge', 
    'cocktail', 'wine bar', 'beer', 'bière', 'drinks', 'boissons', 
    'alcohol', 'alcool', 'spirits', 'brewery'
  ];

  // Types Google Places valides pour les bars
  private static readonly VALID_PRIMARY_TYPES = [
    'bar', 'night_club', 'liquor_store'
  ];

  // Types Google Places interdits
  private static readonly FORBIDDEN_TYPES = [
    'store', 'shopping_mall', 'doctor', 'hospital', 'school', 'church',
    'pharmacy', 'gas_station', 'car_repair', 'bank', 'insurance_agency',
    'real_estate_agency', 'lawyer', 'dentist', 'veterinary_care'
  ];

  static validateBarCandidate(place: NewPlaceResult): BarValidationResult {
    const result: BarValidationResult = {
      isValid: false,
      score: 0,
      reasons: [],
      warnings: [],
      confidence: 'low'
    };

    const displayName = place.displayName?.text || `Place_${place.id.slice(-8)}`;
    
    console.log('🔍 [EDGE STRICT VALIDATION] Validation stricte du candidat:', {
      name: displayName,
      primaryType: place.primaryType,
      types: place.types,
      businessStatus: place.businessStatus
    });

    // 1. Validation du type principal (critère le plus important)
    if (place.primaryType && this.VALID_PRIMARY_TYPES.includes(place.primaryType)) {
      result.score += 60;
      result.reasons.push(`Type principal valide: ${place.primaryType}`);
    } else {
      result.score -= 40;
      result.warnings.push(`Type principal invalide: ${place.primaryType || 'inconnu'}`);
    }

    // 2. Validation stricte du nom (mots-clés interdits)
    const nameLower = displayName.toLowerCase();
    const hasForbiddenKeywords = this.FORBIDDEN_KEYWORDS.some(keyword => 
      nameLower.includes(keyword.toLowerCase())
    );

    if (hasForbiddenKeywords) {
      result.score -= 50;
      result.reasons.push('Nom contient des mots-clés de service non-bar');
      result.warnings.push('REJETÉ: Probablement un service, pas un bar');
      console.log('❌ [EDGE STRICT VALIDATION] REJET IMMÉDIAT - Service détecté:', {
        name: displayName,
        forbiddenKeywords: this.FORBIDDEN_KEYWORDS.filter(k => nameLower.includes(k.toLowerCase()))
      });
      return { ...result, isValid: false, confidence: 'high' };
    }

    // 3. Validation des mots-clés de bar requis
    const hasBarKeywords = this.REQUIRED_BAR_KEYWORDS.some(keyword => 
      nameLower.includes(keyword.toLowerCase())
    );

    if (hasBarKeywords) {
      result.score += 30;
      result.reasons.push('Nom contient des mots-clés de bar');
    } else {
      result.score -= 20;
      result.warnings.push('Nom ne contient pas de mots-clés de bar évidents');
    }

    // 4. Validation des types secondaires
    if (place.types && place.types.length > 0) {
      const hasForbiddenTypes = place.types.some(type => 
        this.FORBIDDEN_TYPES.includes(type)
      );

      if (hasForbiddenTypes) {
        result.score -= 60;
        result.reasons.push('Contient des types interdits');
        result.warnings.push('REJETÉ: Types non-compatibles avec un bar');
        console.log('❌ [EDGE STRICT VALIDATION] REJET IMMÉDIAT - Types interdits:', {
          name: displayName,
          forbiddenTypes: place.types.filter(t => this.FORBIDDEN_TYPES.includes(t))
        });
        return { ...result, isValid: false, confidence: 'high' };
      }
    }

    // 5. Validation du statut d'entreprise
    if (place.businessStatus === 'OPERATIONAL') {
      result.score += 15;
      result.reasons.push('Entreprise opérationnelle');
    } else if (place.businessStatus === 'CLOSED_PERMANENTLY') {
      result.score -= 100;
      result.reasons.push('Entreprise fermée définitivement');
      console.log('❌ [EDGE STRICT VALIDATION] REJET IMMÉDIAT - Fermé définitivement:', displayName);
      return { ...result, isValid: false, confidence: 'high' };
    }

    // 6. Validation de la note (bonus)
    if (place.rating && place.rating >= 4.0) {
      result.score += 10;
      result.reasons.push('Excellente note');
    } else if (place.rating && place.rating >= 3.5) {
      result.score += 5;
      result.reasons.push('Bonne note');
    }

    // 7. Validation finale avec seuil strict
    const MIN_SCORE_THRESHOLD = 70;
    result.isValid = result.score >= MIN_SCORE_THRESHOLD;

    // Détermination du niveau de confiance
    if (result.score >= 90) {
      result.confidence = 'high';
    } else if (result.score >= 70) {
      result.confidence = 'medium';
    } else {
      result.confidence = 'low';
    }

    console.log('📊 [EDGE STRICT VALIDATION] Résultat validation stricte:', {
      name: displayName,
      score: result.score,
      isValid: result.isValid,
      confidence: result.confidence,
      reasons: result.reasons,
      warnings: result.warnings
    });

    return result;
  }
}

// Extraction robuste du nom avec système de fallback
function extractBarNameRobust(place: NewPlaceResult): string {
  console.log('🏷️ [EDGE NAME EXTRACTION] Extraction nom robuste:', {
    id: place.id,
    displayName: place.displayName?.text,
    formattedAddress: place.formattedAddress
  });

  // Priorité 1: displayName.text (le plus fiable)
  if (place.displayName?.text && 
      !place.displayName.text.startsWith('places/') && 
      !place.displayName.text.startsWith('ChIJ') &&
      place.displayName.text.length > 2) {
    console.log('✅ [EDGE NAME EXTRACTION] Utilisation displayName.text:', place.displayName.text);
    return place.displayName.text;
  }

  // Priorité 2: Fallback sur adresse formatée
  if (place.formattedAddress) {
    const addressParts = place.formattedAddress.split(',');
    const possibleName = addressParts[0].trim();
    if (possibleName && 
        possibleName.length > 2 && 
        !possibleName.match(/^\d+/)) {
      console.log('⚠️ [EDGE NAME EXTRACTION] Utilisation adresse:', possibleName);
      return possibleName;
    }
  }

  // Priorité 3: Nom générique basé sur l'ID
  const fallbackName = `Bar ${place.id.slice(-8)}`;
  console.log('⚠️ [EDGE NAME EXTRACTION] Nom générique:', fallbackName);
  return fallbackName;
}

// Sélection STRICTE avec validation multi-critères
function selectBestValidatedBar(bars: NewPlaceResult[]): NewPlaceResult | null {
  if (bars.length === 0) {
    console.log('❌ [EDGE SELECTION] Aucun bar disponible');
    return null;
  }

  console.log('🔄 [EDGE SELECTION] Filtrage strict de', bars.length, 'candidats');

  // Valider et noter tous les bars
  const validatedBars = bars
    .map(place => ({
      place,
      validation: StrictBarValidator.validateBarCandidate(place)
    }))
    .filter(item => item.validation.isValid && item.validation.confidence !== 'low')
    .sort((a, b) => {
      // Trier par confiance puis par score
      if (a.validation.confidence !== b.validation.confidence) {
        const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return confidenceOrder[b.validation.confidence] - confidenceOrder[a.validation.confidence];
      }
      return b.validation.score - a.validation.score;
    });

  console.log('✅ [EDGE SELECTION] Filtrage terminé:', {
    input: bars.length,
    validBars: validatedBars.length,
    rejectionRate: ((bars.length - validatedBars.length) / bars.length * 100).toFixed(1) + '%'
  });

  if (validatedBars.length === 0) {
    console.log('❌ [EDGE SELECTION] Aucun bar n\'a passé la validation stricte');
    return null;
  }

  const selectedBar = validatedBars[0];
  console.log('🎯 [EDGE SELECTION] Bar sélectionné avec validation stricte:', {
    name: selectedBar.place.displayName?.text,
    score: selectedBar.validation.score,
    confidence: selectedBar.validation.confidence,
    primaryType: selectedBar.place.primaryType,
    businessStatus: selectedBar.place.businessStatus
  });

  return selectedBar.place;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, radius = 15000, enhanced = false } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude et longitude requises' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🚀 [EDGE ENHANCED BAR SEARCH] Recherche avec validation stricte:', { 
      latitude, 
      longitude, 
      radius,
      enhanced
    });
    
    // Utiliser la clé API depuis les secrets Supabase
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) {
      console.error('❌ [EDGE ENHANCED BAR SEARCH] Clé API Google Places manquante')
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Recherche Google Places API (New) v1 avec rayon optimal pour Martinique
    const searchUrl = `https://places.googleapis.com/v1/places:searchNearby`;
    
    console.log('🌐 [EDGE ENHANCED BAR SEARCH] Appel Google Places API v1 avec validation stricte');

    const requestBody = {
      includedTypes: ["bar"],
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: Math.max(radius, 15000) // Rayon minimum pour Martinique
        }
      },
      rankPreference: "DISTANCE",
      maxResultCount: 20, // Plus de candidats pour meilleure sélection
      languageCode: "fr-FR"
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.primaryType,places.types,places.businessStatus,places.currentOpeningHours'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    console.log('📊 [EDGE ENHANCED BAR SEARCH] Réponse Google Places API:', { 
      placeCount: data.places?.length,
      hasPlaces: !!data.places
    });

    if (!data.places || data.places.length === 0) {
      console.log('❌ [EDGE ENHANCED BAR SEARCH] Aucun bar trouvé par Google Places API');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar trouvé dans cette zone avec les critères de validation stricte',
          searchLocation: { latitude, longitude, radius },
          enhanced: true
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sélection STRICTE du meilleur bar validé
    const selectedBar = selectBestValidatedBar(data.places);
    
    if (!selectedBar) {
      console.log('❌ [EDGE ENHANCED BAR SEARCH] Aucun bar n\'a passé la validation stricte');
      return new Response(
        JSON.stringify({ 
          error: 'Aucun bar authentique trouvé selon les critères de validation stricte',
          searchLocation: { latitude, longitude, radius },
          totalCandidates: data.places.length,
          validCandidates: 0,
          enhanced: true
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extraction robuste du nom avec système de fallback
    const barName = extractBarNameRobust(selectedBar);
    const placeId = selectedBar.id;
    
    // Validation stricte des données essentielles
    if (!placeId || placeId.length < 10) {
      console.error('❌ [EDGE ENHANCED DATA VALIDATION] Place ID invalide:', placeId);
      throw new Error('Place ID invalide reçu de l\'API');
    }
    
    // Validation finale du nom extrait
    if (!barName || barName.startsWith('places/') || barName.startsWith('ChIJ')) {
      console.error('❌ [EDGE ENHANCED DATA VALIDATION] Nom invalide après extraction:', barName);
      throw new Error('Impossible d\'extraire un nom de bar valide');
    }

    const result = {
      place_id: placeId,
      name: barName,
      formatted_address: selectedBar.formattedAddress || `Coordonnées: ${selectedBar.location.latitude.toFixed(4)}, ${selectedBar.location.longitude.toFixed(4)}`,
      geometry: {
        location: {
          lat: selectedBar.location.latitude,
          lng: selectedBar.location.longitude
        }
      },
      rating: selectedBar.rating,
      price_level: selectedBar.priceLevel,
      types: selectedBar.types || [],
      business_status: selectedBar.businessStatus,
      primaryType: selectedBar.primaryType,
      openNow: selectedBar.currentOpeningHours?.openNow,
      enhanced: true,
      validation: {
        totalCandidates: data.places.length,
        strictValidation: true,
        confidence: 'high'
      }
    };
    
    console.log('🍺 [EDGE ENHANCED BAR SEARCH] Bar sélectionné avec validation stricte réussie:', {
      extractedName: result.name,
      displayName: selectedBar.displayName?.text,
      address: result.formatted_address,
      primaryType: result.primaryType,
      businessStatus: result.business_status,
      rating: result.rating,
      location: result.geometry.location,
      totalCandidates: data.places.length,
      enhanced: true
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ [EDGE ENHANCED BAR SEARCH] Erreur critique:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur lors de la recherche avec validation stricte',
        enhanced: true
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
