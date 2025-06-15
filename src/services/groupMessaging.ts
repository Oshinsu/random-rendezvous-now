
import { supabase } from '@/integrations/supabase/client';

export class GroupMessagingService {
  private static sentSystemMessages = new Set<string>();
  private static lastBarAssignmentTime = new Map<string, number>();

  static async sendGroupSystemMessage(groupId: string, message: string): Promise<void> {
    try {
      // Créer une clé unique pour ce message et groupe
      const messageKey = `${groupId}:${message}`;
      
      // Vérifier si ce message a déjà été envoyé récemment (plus strict)
      if (this.sentSystemMessages.has(messageKey)) {
        console.log('🚫 Message système déjà envoyé récemment, ignoré:', message);
        return;
      }

      // Vérifier spécifiquement pour les messages de bar assigné
      if (message.includes('Rendez-vous au')) {
        const lastTime = this.lastBarAssignmentTime.get(groupId) || 0;
        const now = Date.now();
        if (now - lastTime < 60000) { // 1 minute minimum entre les messages d'assignation
          console.log('🚫 Message d\'assignation de bar trop récent, ignoré');
          return;
        }
        this.lastBarAssignmentTime.set(groupId, now);
      }

      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // ID factice pour les messages système
          message: message,
          is_system: true
        });

      if (error) {
        console.error('❌ Erreur envoi message système groupe:', error);
      } else {
        console.log('✅ Message système envoyé au groupe:', message);
        // Ajouter au cache et supprimer après 2 minutes (plus long)
        this.sentSystemMessages.add(messageKey);
        setTimeout(() => {
          this.sentSystemMessages.delete(messageKey);
        }, 120000);
      }
    } catch (error) {
      console.error('❌ Erreur sendGroupSystemMessage:', error);
    }
  }
}
