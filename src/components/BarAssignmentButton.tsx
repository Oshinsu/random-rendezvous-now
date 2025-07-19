
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EnhancedGooglePlacesService } from '@/services/enhancedGooglePlaces';

interface BarAssignmentButtonProps {
  groupId: string;
  onBarAssigned: () => void;
  userLocation?: {
    latitude: number;
    longitude: number;
    locationName: string;
  } | null;
}

const BarAssignmentButton = ({ groupId, onBarAssigned, userLocation }: BarAssignmentButtonProps) => {
  const [loading, setLoading] = useState(false);

  const assignBar = async () => {
    setLoading(true);
    try {
      console.log('🍺 [ENHANCED BAR ASSIGNMENT] Démarrage assignation avec validation stricte pour groupe:', groupId);

      // Récupérer l'état actuel du groupe
      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('latitude, longitude, location_name')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur récupération groupe:', groupError);
        throw groupError;
      }

      console.log('📍 [ENHANCED BAR ASSIGNMENT] Recherche avec validation stricte:', {
        userLocation,
        groupLocation: {
          latitude: currentGroup.latitude,
          longitude: currentGroup.longitude,
          locationName: currentGroup.location_name
        }
      });

      // Recherche avec service amélioré
      const searchResult = await EnhancedGooglePlacesService.findValidatedBarsNearby(
        userLocation?.latitude || currentGroup.latitude,
        userLocation?.longitude || currentGroup.longitude,
        userLocation?.locationName || currentGroup.location_name
      );

      if (!searchResult.bar) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Aucun bar validé trouvé:', {
          searchMetadata: searchResult.searchMetadata
        });
        
        toast({
          title: '⚠️ Recherche infructueuse',
          description: `Aucun bar authentique trouvé près de ${searchResult.searchMetadata.searchLocation.locationName}. ${searchResult.searchMetadata.rejectedCandidates} lieux rejetés car non-conformes.`,
          variant: 'destructive',
        });
        return;
      }

      // Validation finale côté client
      const selectedBar = searchResult.bar;
      
      // Vérification supplémentaire du nom
      if (selectedBar.name.startsWith('places/') || selectedBar.name.startsWith('ChIJ')) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Nom invalide détecté après toutes validations:', selectedBar.name);
        throw new Error('Données de bar corrompues détectées');
      }

      // Vérification des mots-clés problématiques
      const nameLower = selectedBar.name.toLowerCase();
      const problematicKeywords = ['service', 'services', 'office', 'company', 'entreprise', 'bureau'];
      if (problematicKeywords.some(keyword => nameLower.includes(keyword))) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Mots-clés problématiques détectés:', selectedBar.name);
        throw new Error('Lieu détecté comme service non-bar');
      }

      console.log('✅ [ENHANCED BAR ASSIGNMENT] Bar validé avec tous les critères:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        primaryType: selectedBar.primaryType,
        business_status: selectedBar.business_status,
        confidence: searchResult.searchMetadata.confidence,
        searchStats: {
          totalCandidates: searchResult.searchMetadata.totalCandidates,
          validCandidates: searchResult.searchMetadata.validCandidates,
          rejectedCandidates: searchResult.searchMetadata.rejectedCandidates
        }
      });

      // Définir l'heure de rendez-vous (1h à partir de maintenant)
      const meetingTime = new Date(Date.now() + 1 * 60 * 60 * 1000);

      // Mettre à jour le groupe avec les informations du bar validé
      const updateData = {
        bar_name: selectedBar.name,
        bar_address: selectedBar.formatted_address,
        meeting_time: meetingTime.toISOString(),
        bar_latitude: selectedBar.geometry.location.lat,
        bar_longitude: selectedBar.geometry.location.lng,
        bar_place_id: selectedBar.place_id
      };

      const { error: updateError } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId);

      if (updateError) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur mise à jour groupe:', updateError);
        throw updateError;
      }

      console.log('✅ [ENHANCED BAR ASSIGNMENT] Bar assigné avec validation stricte réussie');

      toast({
        title: '🍺 Bar authentique assigné !',
        description: (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-semibold">{selectedBar.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              Rendez-vous à {meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-500">
              Validé par {searchResult.searchMetadata.validCandidates} critères de qualité
            </div>
          </div>
        ),
      });

      onBarAssigned();
    } catch (error) {
      console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur critique:', error);
      toast({
        title: 'Erreur de validation',
        description: 'Impossible d\'assigner un bar avec les critères de qualité requis. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={assignBar}
      disabled={loading}
      variant="outline"
      size="sm"
      className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-800 hover:from-amber-100 hover:to-orange-100 hover:border-amber-400 transition-all duration-200"
    >
      {loading ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Validation stricte...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Assigner bar authentique
        </>
      )}
    </Button>
  );
};

export default BarAssignmentButton;
