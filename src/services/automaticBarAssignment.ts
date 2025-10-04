import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/cleanLogging';

export class AutomaticBarAssignmentService {
  /**
   * Attribution automatique de bar - VERSION AMÉLIORÉE
   */
  static async assignBarToGroup(groupId: string): Promise<boolean> {
    try {
      logger.info('Attribution automatique de bar pour groupe', { groupId });

      // 1. Vérifier le groupe
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, latitude, longitude, current_participants, status, bar_name')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        logger.error('Groupe introuvable', groupError);
        return false;
      }

      // 2. Vérifier l'éligibilité (5 participants, confirmé, pas de bar)
      if (group.current_participants !== 5 || group.status !== 'confirmed' || group.bar_name) {
        logger.debug('Groupe non éligible pour attribution');
        return false;
      }

      // 3. Vérifier les coordonnées (géolocalisation obligatoire)
      if (!group.latitude || !group.longitude) {
        logger.error('Géolocalisation manquante pour le groupe');
        await this.sendSystemMessage(groupId, '⚠️ Géolocalisation requise pour assigner un bar automatiquement.');
        return false;
      }

      const searchLatitude = group.latitude;
      const searchLongitude = group.longitude;

      logger.debug('Recherche avec coordonnées', { searchLatitude, searchLongitude });

      // 4. Appel Edge Function CORRIGÉE - simple-auto-assign-bar
      const { data: barResponse, error: barError } = await supabase.functions.invoke('simple-auto-assign-bar', {
        body: { 
          group_id: groupId,
          latitude: searchLatitude, 
          longitude: searchLongitude 
        }
      });

      if (barError) {
        logger.error('Erreur Edge Function', barError);
        await this.sendSystemMessage(groupId, '⚠️ Erreur lors de la recherche automatique de bar.');
        return false;
      }

      if (!barResponse?.success || !barResponse?.bar?.name) {
        logger.error('Aucun bar trouvé dans la réponse');
        await this.sendSystemMessage(groupId, '⚠️ Aucun bar trouvé automatiquement dans votre zone.');
        return false;
      }

      // 5. Mise à jour du groupe avec le bar trouvé
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
        logger.error('Erreur mise à jour groupe', updateError);
        return false;
      }

      // 6. Track bar visit assignment
      if (typeof window !== 'undefined') {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'bar_visit',
          group_id: groupId,
          bar_name: barResponse.bar.name,
          bar_address: barResponse.bar.formatted_address,
          bar_place_id: barResponse.bar.place_id,
          meeting_time: meetingTime.toISOString(),
          assignment_type: 'automatic'
        });
      }

      // 7. Message de confirmation avec détails
      await this.sendSystemMessage(
        groupId, 
        `🍺 Votre groupe est complet ! Rendez-vous au ${barResponse.bar.name} à ${meetingTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} 🎉`
      );

      logger.info('Attribution réussie', {
        groupId,
        barName: barResponse.bar.name,
        address: barResponse.bar.formatted_address,
        meetingTime: meetingTime.toISOString()
      });

      return true;

    } catch (error) {
      logger.error('Erreur globale', error);
      await this.sendSystemMessage(groupId, '⚠️ Erreur technique lors de l\'attribution automatique.');
      return false;
    }
  }

  /**
   * Envoi de message système avec réduction des doublons
   */
  private static async sendSystemMessage(groupId: string, message: string): Promise<void> {
    try {
      // NOUVEAU: Vérifier s'il n'y a pas déjà un message système récent similaire
      const { data: recentMessages } = await supabase
        .from('group_messages')
        .select('id')
        .eq('group_id', groupId)
        .eq('is_system', true)
        .gte('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString()) // 2 minutes
        .ilike('message', '%bar%'); // Messages contenant "bar"

      if (recentMessages && recentMessages.length > 0) {
        logger.debug('Message système similaire récent trouvé, éviter le doublon');
        return;
      }

      await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000',
          message: message,
          is_system: true
        });
      
      logger.debug('Message système envoyé', { message });
    } catch (error) {
      logger.error('Erreur envoi message système', error);
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
        
      logger.debug('Messages de déclenchement nettoyés');
    } catch (error) {
      logger.error('Erreur nettoyage messages', error);
    }
  }
}
