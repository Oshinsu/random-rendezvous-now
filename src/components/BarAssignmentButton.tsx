
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
      console.log('🍺 Assignation manuelle de bar pour le groupe:', groupId);

      // Récupérer l'état actuel du groupe
      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('latitude, longitude')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ Erreur récupération groupe:', groupError);
        throw groupError;
      }

      // Déterminer la position pour la recherche
      let searchLatitude = currentGroup.latitude;
      let searchLongitude = currentGroup.longitude;
      
      // Utiliser la position utilisateur si disponible
      if (!searchLatitude && !searchLongitude && userLocation) {
        searchLatitude = userLocation.latitude;
        searchLongitude = userLocation.longitude;
        console.log('📍 Utilisation position utilisateur:', { searchLatitude, searchLongitude });
      }
      
      // Fallback sur Paris si aucune position disponible
      if (!searchLatitude && !searchLongitude) {
        searchLatitude = 48.8566;
        searchLongitude = 2.3522;
        console.log('⚠️ Utilisation position Paris par défaut');
      }

      console.log('🔍 Recherche de bar avec position:', { searchLatitude, searchLongitude });

      // Rechercher un bar via l'API
      const selectedBar = await GooglePlacesService.findNearbyBars(
        searchLatitude,
        searchLongitude,
        8000
      );

      if (!selectedBar || !selectedBar.name) {
        throw new Error('Aucun bar trouvé dans la zone');
      }

      // Validation stricte des données reçues
      if (selectedBar.name.startsWith('places/') || selectedBar.name.startsWith('ChIJ')) {
        console.error('❌ [BAR ASSIGNMENT VALIDATION] Nom invalide détecté:', selectedBar.name);
        console.error('   - Données complètes:', JSON.stringify(selectedBar, null, 2));
        throw new Error('Données de bar invalides - nom corrrompu');
      }

      console.log('✅ [BAR ASSIGNMENT VALIDATION] Bar validé:', {
        name: selectedBar.name,
        place_id: selectedBar.place_id,
        address: selectedBar.formatted_address
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
        console.error('❌ Erreur mise à jour groupe:', updateError);
        throw updateError;
      }

      console.log('✅ Bar assigné avec succès:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        meetingTime: meetingTime.toLocaleString('fr-FR')
      });

      toast({
        title: '🍺 Bar assigné !',
        description: `Rendez-vous au ${selectedBar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      });

      onBarAssigned();
    } catch (error) {
      console.error('❌ Erreur assignation bar:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner un bar. Veuillez réessayer.',
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
      {loading ? 'Recherche...' : 'Assigner un bar'}
    </Button>
  );
};

export default BarAssignmentButton;
