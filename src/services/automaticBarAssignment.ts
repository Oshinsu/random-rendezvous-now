
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
    confidence_score?: number;
    fallback_used?: string;
  };
  error?: string;
}

export class AutomaticBarAssignmentService {
  /**
   * Attribution automatique de bar avec gestion d'erreur robuste et scoring avancé
   */
  static async assignBarToGroup(groupId: string): Promise<boolean> {
    try {
      console.log('🤖 [ENHANCED BAR ASSIGNMENT] Démarrage attribution pour groupe:', groupId);

      // 1. Vérification d'éligibilité avec les nouvelles politiques RLS
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, latitude, longitude, current_participants, status, bar_name, bar_place_id')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur récupération groupe:', groupError);
        return false;
      }

      // 2. Vérifications d'éligibilité
      const isEligible = (
        group.current_participants === 5 &&
        group.status === 'confirmed' &&
        !group.bar_name &&
        !group.bar_place_id
      );

      if (!isEligible) {
        console.log('ℹ️ [ENHANCED BAR ASSIGNMENT] Groupe non éligible:', {
          id: groupId,
          participants: group.current_participants,
          status: group.status,
          hasBar: !!group.bar_name
        });
        return false;
      }

      // 3. Validation des coordonnées avec fallback
      const searchLatitude = group.latitude || 48.8566;
      const searchLongitude = group.longitude || 2.3522;

      if (!this.validateCoordinates(searchLatitude, searchLongitude)) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Coordonnées invalides');
        await this.sendSystemMessage(groupId, '⚠️ Position invalide pour la recherche automatique.');
        return false;
      }

      // 4. Appel de l'Edge Function avec enhanced logic
      const { data: barResponse, error: barError } = await supabase.functions.invoke('auto-assign-bar', {
        body: {
          group_id: groupId,
          latitude: searchLatitude,
          longitude: searchLongitude
        }
      });

      if (barError) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur Edge Function:', barError);
        await this.sendSystemMessage(groupId, '⚠️ Erreur lors de la recherche automatique.');
        return false;
      }

      const response = barResponse as BarAssignmentResponse;
      
      if (!response?.success || !response?.bar) {
        await this.sendSystemMessage(groupId, '⚠️ Aucun bar disponible trouvé automatiquement.');
        return false;
      }

      // Validation stricte des données reçues avec enhanced checks
      if (!response.bar.name || response.bar.name.startsWith('places/') || response.bar.name.startsWith('ChIJ')) {
        console.error('❌ [ENHANCED BAR ASSIGNMENT VALIDATION] Nom invalide détecté:', response.bar.name);
        console.error('   - Données complètes:', JSON.stringify(response.bar, null, 2));
        await this.sendSystemMessage(groupId, '⚠️ Données de bar invalides reçues - nouvelle tentative requise.');
        return false;
      }

      console.log('✅ [ENHANCED BAR ASSIGNMENT VALIDATION] Bar validé:', {
        name: response.bar.name,
        place_id: response.bar.place_id,
        address: response.bar.formatted_address,
        confidence: response.bar.confidence_score,
        fallback: response.bar.fallback_used
      });

      // 5. Mise à jour atomique du groupe
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
        console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur mise à jour:', updateError);
        await this.sendSystemMessage(groupId, '⚠️ Erreur lors de l\'attribution.');
        return false;
      }

      // 6. Message de confirmation avec informations sur la qualité
      let confirmationMessage = `🍺 Votre groupe est complet ! Rendez-vous au ${response.bar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      
      // Add confidence and fallback info if available
      if (response.bar.confidence_score && response.bar.confidence_score < 70) {
        confirmationMessage += '\n💡 Vérifiez les informations du bar avant de vous déplacer.';
      }
      
      if (response.bar.fallback_used) {
        confirmationMessage += `\n⚠️ ${response.bar.fallback_used}`;
      }

      await this.sendSystemMessage(groupId, confirmationMessage);

      console.log('✅ [ENHANCED BAR ASSIGNMENT] Attribution réussie:', {
        name: response.bar.name,
        confidence: response.bar.confidence_score,
        fallback: response.bar.fallback_used
      });
      return true;

    } catch (error) {
      console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur globale:', error);
      await this.sendSystemMessage(groupId, '⚠️ Erreur technique lors de l\'attribution automatique.');
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
   * Envoi de message système optimisé pour les nouvelles politiques RLS
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
      console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur envoi message système:', error);
    }
  }

  /**
   * Nettoyage des messages de déclenchement
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
      console.error('❌ [ENHANCED BAR ASSIGNMENT] Erreur nettoyage messages:', error);
    }
  }
}
