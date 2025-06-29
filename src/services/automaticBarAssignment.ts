
import { supabase } from '@/integrations/supabase/client';
import { GooglePlacesService } from './googlePlaces';

export class AutomaticBarAssignmentService {
  /**
   * SYSTÈME D'ATTRIBUTION AUTOMATIQUE UNIFIÉ
   * Attribue automatiquement un bar à un groupe de 5 participants confirmés
   */
  static async assignBarToGroup(groupId: string): Promise<boolean> {
    try {
      console.log('🤖 [BAR ASSIGNMENT] Démarrage attribution automatique pour groupe:', groupId);

      // 1. Récupérer et valider les informations du groupe
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, latitude, longitude, current_participants, status, bar_name, bar_place_id')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ [BAR ASSIGNMENT] Erreur récupération groupe:', groupError);
        return false;
      }

      if (!group) {
        console.error('❌ [BAR ASSIGNMENT] Groupe introuvable:', groupId);
        return false;
      }

      // 2. Vérifications d'éligibilité STRICTES
      const isEligible = (
        group.current_participants === 5 &&
        group.status === 'confirmed' &&
        !group.bar_name &&
        !group.bar_place_id
      );

      if (!isEligible) {
        console.log('ℹ️ [BAR ASSIGNMENT] Groupe non éligible:', {
          id: groupId,
          participants: group.current_participants,
          status: group.status,
          hasBar: !!group.bar_name,
          hasPlaceId: !!group.bar_place_id
        });
        return false;
      }

      // 3. Utiliser les coordonnées du groupe avec fallback sur Paris
      const searchLatitude = group.latitude || 48.8566;
      const searchLongitude = group.longitude || 2.3522;

      console.log('🔍 [BAR ASSIGNMENT] Recherche bar avec coordonnées:', { 
        lat: searchLatitude, 
        lng: searchLongitude 
      });

      // 4. Rechercher un bar via le service Google Places
      const selectedBar = await GooglePlacesService.findNearbyBars(
        searchLatitude,
        searchLongitude,
        8000 // Rayon de 8km
      );

      if (!selectedBar || !selectedBar.name) {
        console.log('⚠️ [BAR ASSIGNMENT] Aucun bar trouvé pour attribution automatique');
        
        // Envoyer un message d'échec
        await this.sendSystemMessage(
          groupId,
          '⚠️ Aucun bar disponible trouvé automatiquement. Vous pouvez choisir un lieu manuellement.'
        );
        return false;
      }

      // 5. Définir l'heure de rendez-vous (1 heure à partir de maintenant)
      const meetingTime = new Date(Date.now() + 60 * 60 * 1000);

      // 6. Mettre à jour le groupe avec les informations du bar - TRANSACTION ATOMIQUE
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
        .eq('id', groupId)
        .eq('status', 'confirmed') // Condition de sécurité
        .is('bar_name', null); // S'assurer qu'aucun bar n'est déjà assigné

      if (updateError) {
        console.error('❌ [BAR ASSIGNMENT] Erreur mise à jour groupe:', updateError);
        return false;
      }

      // 7. Envoyer le message de confirmation
      await this.sendSystemMessage(
        groupId,
        `🍺 Votre groupe est complet ! Rendez-vous au ${selectedBar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      );

      console.log('✅ [BAR ASSIGNMENT] Attribution automatique réussie:', {
        group: groupId,
        bar: selectedBar.name,
        address: selectedBar.formatted_address,
        meetingTime: meetingTime.toLocaleString('fr-FR')
      });

      return true;
    } catch (error) {
      console.error('❌ [BAR ASSIGNMENT] Erreur attribution automatique:', error);
      return false;
    }
  }

  /**
   * Envoie un message système au groupe
   */
  private static async sendSystemMessage(groupId: string, message: string): Promise<void> {
    try {
      await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000',
          message: message,
          is_system: true
        });
    } catch (error) {
      console.error('❌ [BAR ASSIGNMENT] Erreur envoi message système:', error);
    }
  }

  /**
   * Nettoie les messages de déclenchement d'attribution automatique
   */
  static async cleanupTriggerMessages(groupId: string): Promise<void> {
    try {
      await supabase
        .from('group_messages')
        .delete()
        .eq('group_id', groupId)
        .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER')
        .eq('is_system', true);
    } catch (error) {
      console.error('❌ [BAR ASSIGNMENT] Erreur nettoyage messages déclenchement:', error);
    }
  }
}
