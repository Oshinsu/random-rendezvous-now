
import { supabase } from '@/integrations/supabase/client';

export class AutomaticBarAssignmentService {
  /**
   * Attribution automatique de bar - VERSION ULTRA SIMPLIFIÉE
   */
  static async assignBarToGroup(groupId: string): Promise<boolean> {
    try {
      console.log('🤖 [AUTO-ASSIGN] Attribution pour groupe:', groupId);

      // Vérifier le groupe
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, latitude, longitude, current_participants, status, bar_name')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        console.error('❌ Groupe introuvable:', groupError);
        return false;
      }

      // Vérifier l'éligibilité
      if (group.current_participants !== 5 || group.status !== 'confirmed' || group.bar_name) {
        console.log('ℹ️ Groupe non éligible');
        return false;
      }

      // Coordonnées
      const searchLatitude = group.latitude || 48.8566;
      const searchLongitude = group.longitude || 2.3522;

      // Appel Edge Function unique
      const { data: barResponse, error: barError } = await supabase.functions.invoke('simple-auto-assign-bar', {
        body: { 
          group_id: groupId,
          latitude: searchLatitude, 
          longitude: searchLongitude 
        }
      });

      if (barError || !barResponse?.success || !barResponse?.bar?.name) {
        console.error('❌ Aucun bar trouvé');
        await this.sendSystemMessage(groupId, '⚠️ Aucun bar trouvé automatiquement.');
        return false;
      }

      // Mise à jour du groupe
      const meetingTime = new Date(Date.now() + 60 * 60 * 1000);

      const { error: updateError } = await supabase
        .from('groups')
        .update({
          bar_name: barResponse.bar.name,
          bar_address: barResponse.bar.formatted_address,
          meeting_time: meetingTime.toISOString(),
          bar_latitude: barResponse.bar.geometry.location.lat,
          bar_longitude: barResponse.bar.geometry.location.lng,
          bar_place_id: barResponse.bar.place_id
        })
        .eq('id', groupId);

      if (updateError) {
        console.error('❌ Erreur mise à jour:', updateError);
        return false;
      }

      // Message de confirmation
      await this.sendSystemMessage(
        groupId, 
        `🍺 Votre groupe est complet ! Rendez-vous au ${barResponse.bar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      );

      console.log('✅ Bar assigné:', barResponse.bar.name);
      return true;

    } catch (error) {
      console.error('❌ Erreur globale:', error);
      await this.sendSystemMessage(groupId, '⚠️ Erreur lors de l\'attribution automatique.');
      return false;
    }
  }

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
      console.error('❌ Erreur envoi message système:', error);
    }
  }
}
