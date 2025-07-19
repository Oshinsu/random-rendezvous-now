
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GooglePlacesService } from '@/services/googlePlaces';
import { GeolocationService } from '@/services/geolocation';

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
      console.log('🍺 [ENHANCED] Assignation manuelle de bar avec validation améliorée pour le groupe:', groupId);

      // Récupérer l'état actuel du groupe
      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('latitude, longitude')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ [ENHANCED] Erreur récupération groupe:', groupError);
        throw groupError;
      }

      // Déterminer la position pour la recherche
      let searchLatitude = currentGroup.latitude;
      let searchLongitude = currentGroup.longitude;
      
      // Utiliser la position utilisateur si disponible
      if (!searchLatitude && !searchLongitude && userLocation) {
        searchLatitude = userLocation.latitude;
        searchLongitude = userLocation.longitude;
        console.log('📍 [ENHANCED] Utilisation position utilisateur:', { searchLatitude, searchLongitude });
      }
      
      // Fallback sur Paris si aucune position disponible
      if (!searchLatitude && !searchLongitude) {
        searchLatitude = 48.8566;
        searchLongitude = 2.3522;
        console.log('⚠️ [ENHANCED] Utilisation position Paris par défaut');
      }

      console.log('🔍 [ENHANCED] Recherche de bar avec validation améliorée:', { searchLatitude, searchLongitude });

      // Rechercher un bar via l'API améliorée
      const selectedBar = await GooglePlacesService.findNearbyBars(
        searchLatitude,
        searchLongitude,
        15000 // Increased radius
      );

      if (!selectedBar || !selectedBar.name) {
        throw new Error('Aucun bar validé trouvé dans la zone');
      }

      // Validation stricte améliorée des données reçues
      if (selectedBar.name.startsWith('places/') || selectedBar.name.startsWith('ChIJ')) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT VALIDATION] Nom invalide détecté:', selectedBar.name);
        console.error('   - Données complètes:', JSON.stringify(selectedBar, null, 2));
        throw new Error('Données de bar invalides - nom corrompu');
      }

      // Validation supplémentaire pour les services non-bar
      const nameLower = selectedBar.name.toLowerCase();
      const problematicKeywords = ['service', 'services', 'office', 'company', 'entreprise', 'bureau'];
      if (problematicKeywords.some(keyword => nameLower.includes(keyword))) {
        console.warn('⚠️ [ENHANCED BAR ASSIGNMENT VALIDATION] Bar potentiellement invalide:', selectedBar.name);
        toast({
          title: '⚠️ Attention',
          description: `Le lieu sélectionné (${selectedBar.name}) pourrait ne pas être un bar. Vérifiez l'adresse.`,
          variant: 'default',
        });
      }

      console.log('✅ [ENHANCED BAR ASSIGNMENT VALIDATION] Bar validé avec critères améliorés:', {
        name: selectedBar.name,
        place_id: selectedBar.place_id,
        address: selectedBar.formatted_address,
        primaryType: selectedBar.primaryType || 'N/A',
        businessStatus: selectedBar.businessStatus || 'N/A'
      });

      // Définir l'heure de rendez-vous (1h à partir de maintenant)
      const meetingTime = new Date(Date.now() + 1 * 60 * 60 * 1000);

      // Mettre à jour le groupe avec les informations du bar
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
        console.error('❌ [ENHANCED] Erreur mise à jour groupe:', updateError);
        throw updateError;
      }

      console.log('✅ [ENHANCED] Bar assigné avec validation améliorée:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        meetingTime: meetingTime.toLocaleString('fr-FR'),
        enhancedValidation: true
      });

      toast({
        title: '🍺 Bar assigné avec validation améliorée !',
        description: `Rendez-vous au ${selectedBar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      });

      onBarAssigned();
    } catch (error) {
      console.error('❌ [ENHANCED] Erreur assignation bar avec validation améliorée:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner un bar avec la validation améliorée. Veuillez réessayer.',
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
      className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Recherche validée...' : 'Assigner un bar (validé)'}
    </Button>
  );
};

export default BarAssignmentButton;
