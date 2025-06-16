
import { supabase } from '@/integrations/supabase/client';
import { GooglePlacesService } from './googlePlaces';

export class AutomaticBarAssignmentService {
  static async assignBarToGroup(groupId: string): Promise<boolean> {
    try {
      console.log('🤖 Attribution automatique de bar pour le groupe:', groupId);

      // Récupérer les informations du groupe
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('latitude, longitude, current_participants, status, bar_name')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ Erreur récupération groupe:', groupError);
        return false;
      }

      // Vérifier que le groupe est éligible (5 participants, status confirmed, pas de bar déjà assigné)
      if (group.current_participants !== 5 || group.status !== 'confirmed' || group.bar_name) {
        console.log('ℹ️ Groupe non éligible pour attribution automatique:', {
          participants: group.current_participants,
          status: group.status,
          hasBar: !!group.bar_name
        });
        return false;
      }

      // Utiliser les coordonnées du groupe ou fallback sur Paris
      const searchLatitude = group.latitude || 48.8566;
      const searchLongitude = group.longitude || 2.3522;

      console.log('🔍 Recherche automatique de bar avec position:', { searchLatitude, searchLongitude });

      // Rechercher un bar via l'API
      const selectedBar = await GooglePlacesService.findNearbyBars(
        searchLatitude,
        searchLongitude,
        8000
      );

      if (!selectedBar || !selectedBar.name) {
        console.log('⚠️ Aucun bar trouvé pour attribution automatique');
        return false;
      }

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
        console.error('❌ Erreur mise à jour automatique groupe:', updateError);
        return false;
      }

      console.log('✅ Bar assigné automatiquement:', {
        name: selectedBar.name,
        address: selectedBar.formatted_address,
        meetingTime: meetingTime.toLocaleString('fr-FR')
      });

      // Envoyer un message système pour informer les participants
      await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // UUID système
          message: `🍺 Votre groupe est complet ! Rendez-vous au ${selectedBar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
          is_system: true
        });

      return true;
    } catch (error) {
      console.error('❌ Erreur attribution automatique bar:', error);
      return false;
    }
  }
}
