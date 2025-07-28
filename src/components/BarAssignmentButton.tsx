
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GooglePlacesService } from '@/services/googlePlaces';
import { useAnalytics } from '@/hooks/useAnalytics';

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
  const { track } = useAnalytics();

  const assignBar = async () => {
    setLoading(true);
    try {
      console.log('🍺 [SIMPLE MANUAL ASSIGNMENT] Attribution manuelle pour:', groupId);

      // Récupérer les coordonnées du groupe
      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('latitude, longitude')
        .eq('id', groupId)
        .single();

      if (groupError) {
        throw new Error('Erreur récupération groupe');
      }

      // Déterminer la position de recherche
      let searchLatitude = currentGroup.latitude;
      let searchLongitude = currentGroup.longitude;
      
      if (!searchLatitude && userLocation) {
        searchLatitude = userLocation.latitude;
        searchLongitude = userLocation.longitude;
      }
      
      if (!searchLatitude) {
        searchLatitude = 48.8566; // Paris par défaut
        searchLongitude = 2.3522;
      }

      console.log('🔍 Recherche de bar:', { searchLatitude, searchLongitude });

      // Rechercher un bar de façon simple
      const selectedBar = await GooglePlacesService.findNearbyBars(searchLatitude, searchLongitude);

      if (!selectedBar) {
        throw new Error('Aucun bar trouvé');
      }

      // Heure de rendez-vous
      const meetingTime = new Date(Date.now() + 1 * 60 * 60 * 1000);

      // Mettre à jour le groupe
      const { error: updateError } = await supabase
        .from('groups')
        .update({
          bar_name: selectedBar.name,
          bar_address: selectedBar.formatted_address,
          meeting_time: meetingTime.toISOString(),
          bar_latitude: selectedBar.geometry.location.lat,
          bar_longitude: selectedBar.geometry.location.lng,
          bar_place_id: selectedBar.place_id
        })
        .eq('id', groupId);

      if (updateError) {
        throw new Error('Erreur mise à jour');
      }

      console.log('✅ Bar assigné:', selectedBar.name);

      // Track bar visit assignment
      track('bar_visit', {
        group_id: groupId,
        bar_name: selectedBar.name,
        bar_address: selectedBar.formatted_address,
        bar_place_id: selectedBar.place_id,
        meeting_time: meetingTime.toISOString(),
        location: userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          location_name: userLocation.locationName
        } : null
      });

      toast({
        title: '🍺 Bar assigné !',
        description: `Rendez-vous au ${selectedBar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      });

      onBarAssigned();
    } catch (error) {
      console.error('❌ Erreur assignation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner un bar. Réessayez.',
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
