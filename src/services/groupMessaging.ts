
import { supabase } from '@/integrations/supabase/client';

export class GroupMessagingService {
  // Cache pour éviter les messages en double - AUGMENTÉ pour plus d'efficacité
  private static sentSystemMessages = new Set<string>();
  
  // Cache pour les derniers messages d'attribution de bar (délai augmenté à 5 minutes)
  private static lastBarAssignmentTime = new Map<string, number>();
  
  /**
   * Envoyer un message système à un groupe avec filtrage ULTRA STRICT
   * SEULEMENT 2 types de messages autorisés : Bienvenue + Confirmation bar
   */
  static async sendGroupSystemMessage(groupId: string, message: string): Promise<void> {
    try {
      // Whitelist stricte : SEULEMENT ces 2 messages passent
      const isWelcomeMessage = message.includes('Bienvenue') && message.includes('groupe créé');
      const isBarConfirmed = message.includes('Rendez-vous au');
      
      if (!isWelcomeMessage && !isBarConfirmed) {
        console.log('⏭️ [GROUP MESSAGING] Message système filtré (non critique):', message);
        return;
      }

      // Rate limiting AUGMENTÉ pour les messages d'attribution de bar (délai de 5 minutes)
      if (message.includes('Rendez-vous au') || message.includes('bar assigné')) {
        const lastTime = this.lastBarAssignmentTime.get(groupId);
        const now = Date.now();
        
        if (lastTime && (now - lastTime) < 5 * 60 * 1000) { // 5 minutes (augmenté)
          console.log('⏳ [GROUP MESSAGING] Message d\'attribution de bar rate limited pour groupe:', groupId);
          return;
        }
        
        this.lastBarAssignmentTime.set(groupId, now);
      }

      // NOUVEAU: Vérifier les messages récents en base pour éviter les doublons
      const { data: recentMessages } = await supabase
        .from('group_messages')
        .select('id, message')
        .eq('group_id', groupId)
        .eq('is_system', true)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes
        .limit(5);

      if (recentMessages && recentMessages.some(msg => 
        msg.message.includes(message.substring(0, 30)) || 
        message.includes(msg.message.substring(0, 30))
      )) {
        console.log('⏭️ [GROUP MESSAGING] Message système similaire récent trouvé, éviter le doublon');
        return;
      }

      // Clé unique pour éviter les doublons en mémoire
      const messageKey = `${groupId}-${message.substring(0, 50)}`;
      
      if (this.sentSystemMessages.has(messageKey)) {
        console.log('⏭️ [GROUP MESSAGING] Message système déjà envoyé, éviter le doublon:', messageKey);
        return;
      }

      // Envoyer le message
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // ID système
          message: message,
          is_system: true
        });

      if (error) {
        console.error('❌ [GROUP MESSAGING] Erreur envoi message système:', error);
        return;
      }

      // Ajouter au cache pour éviter les doublons (expire après 10 minutes)
      this.sentSystemMessages.add(messageKey);
      setTimeout(() => {
        this.sentSystemMessages.delete(messageKey);
      }, 10 * 60 * 1000); // 10 minutes (augmenté)

      console.log('✅ [GROUP MESSAGING] Message système critique envoyé:', { groupId, message: message.substring(0, 100) });
    } catch (error) {
      console.error('❌ [GROUP MESSAGING] Erreur dans sendGroupSystemMessage:', error);
    }
  }
}
