
import { supabase } from '@/integrations/supabase/client';

export class AutomaticBarAssignmentService {
  /**
   * Attribution automatique de bar - VERSION AVEC TRIGGER RESTAURÉ
   */
  static async assignBarToGroup(groupId: string): Promise<boolean> {
    try {
      console.log('🤖 [AUTO-ASSIGN] Attribution avec trigger pour groupe:', groupId);

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

      // Déclencher le trigger en insérant le message système
      console.log('🔥 Déclenchement du trigger group-participant-trigger');
      
      const { error: triggerError } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000',
          message: 'AUTO_BAR_ASSIGNMENT_TRIGGER',
          is_system: true
        });

      if (triggerError) {
        console.error('❌ Erreur déclenchement trigger:', triggerError);
        return false;
      }

      // Attendre un peu puis déclencher le traitement
      setTimeout(async () => {
        try {
          console.log('⚡ Appel du trigger group-participant-trigger');
          await supabase.functions.invoke('group-participant-trigger');
        } catch (error) {
          console.error('❌ Erreur appel trigger:', error);
        }
      }, 2000);

      console.log('✅ Trigger déclenché avec succès');
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
