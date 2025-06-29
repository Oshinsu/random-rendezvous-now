
import { supabase } from '@/integrations/supabase/client';

// Interface standardisée pour les réponses
interface BarAssignmentResponse {
  success: boolean;
  bar?: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
  };
  error?: string;
}

export class AutomaticBarAssignmentService {
  /**
   * SYSTÈME D'ATTRIBUTION AUTOMATIQUE UNIFIÉ ET CORRIGÉ
   * Attribution avec gestion d'erreur robuste et validation stricte
   */
  static async assignBarToGroup(groupId: string): Promise<boolean> {
    try {
      console.log('🤖 [BAR ASSIGNMENT] Démarrage attribution UNIFIÉE pour groupe:', groupId);

      // 1. Vérification d'éligibilité STRICTE avec verrouillage
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

      // 3. Coordonnées avec validation stricte et fallback sécurisé
      const searchLatitude = group.latitude || 48.8566;
      const searchLongitude = group.longitude || 2.3522;

      // Validation des coordonnées
      if (!this.validateCoordinates(searchLatitude, searchLongitude)) {
        console.error('❌ [BAR ASSIGNMENT] Coordonnées invalides:', { 
          lat: searchLatitude, 
          lng: searchLongitude 
        });
        return false;
      }

      console.log('🔍 [BAR ASSIGNMENT] Recherche avec coordonnées validées:', { 
        lat: searchLatitude, 
        lng: searchLongitude 
      });

      // 4. Appel de l'Edge Function avec gestion d'erreur robuste
      const { data: barResponse, error: barError } = await supabase.functions.invoke('auto-assign-bar', {
        body: {
          group_id: groupId,
          latitude: searchLatitude,
          longitude: searchLongitude
        }
      });

      if (barError) {
        console.error('❌ [BAR ASSIGNMENT] Erreur Edge Function:', barError);
        await this.sendSystemMessage(
          groupId,
          '⚠️ Erreur lors de la recherche automatique. Veuillez choisir manuellement.'
        );
        return false;
      }

      // 5. Traitement de la réponse standardisée
      const response = barResponse as BarAssignmentResponse;
      
      if (!response?.success || !response?.bar) {
        console.log('⚠️ [BAR ASSIGNMENT] Aucun bar trouvé:', response?.error);
        await this.sendSystemMessage(
          groupId,
          '⚠️ Aucun bar disponible trouvé automatiquement. Vous pouvez choisir un lieu manuellement.'
        );
        return false;
      }

      // 6. Mise à jour atomique du groupe avec conditions strictes
      const meetingTime = new Date(Date.now() + 60 * 60 * 1000);

      const { error: updateError } = await supabase
        .from('groups')
        .update({
          bar_name: response.bar.name,
          bar_address: response.bar.formatted_address,
          meeting_time: meetingTime.toISOString(),
          bar_latitude: response.bar.geometry.location.lat,
          bar_longitude: response.bar.geometry.location.lng,
          bar_place_id: response.bar.place_id
        })
        .eq('id', groupId)
        .eq('status', 'confirmed')
        .eq('current_participants', 5)
        .is('bar_name', null);

      if (updateError) {
        console.error('❌ [BAR ASSIGNMENT] Erreur mise à jour atomique:', updateError);
        await this.sendSystemMessage(
          groupId,
          '⚠️ Erreur lors de l\'attribution. Veuillez réessayer.'
        );
        return false;
      }

      // 7. Message de confirmation avec formatage uniforme
      await this.sendSystemMessage(
        groupId,
        `🍺 Votre groupe est complet ! Rendez-vous au ${response.bar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      );

      console.log('✅ [BAR ASSIGNMENT] Attribution réussie:', {
        group: groupId,
        bar: response.bar.name,
        address: response.bar.formatted_address,
        meetingTime: meetingTime.toLocaleString('fr-FR')
      });

      return true;
    } catch (error) {
      console.error('❌ [BAR ASSIGNMENT] Erreur globale:', error);
      await this.sendSystemMessage(
        groupId,
        '⚠️ Erreur technique lors de l\'attribution automatique.'
      );
      return false;
    }
  }

  /**
   * Validation stricte des coordonnées
   */
  private static validateCoordinates(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (!isFinite(lat) || !isFinite(lng)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
  }

  /**
   * Envoi de message système avec gestion d'erreur
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
   * Nettoyage des messages de déclenchement (utilisé par les hooks)
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
      console.error('❌ [BAR ASSIGNMENT] Erreur nettoyage messages:', error);
    }
  }
}
