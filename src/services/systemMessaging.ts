
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';

export class SystemMessagingService {
  /**
   * Créer un message de bienvenue automatique pour un nouveau groupe
   */
  static async createWelcomeMessage(groupId: string): Promise<boolean> {
    try {
      const welcomeMessage = "🎉 Bienvenue dans votre nouveau groupe Random ! Présentez-vous et préparez cette aventure ensemble.";
      
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // ID système
          message: welcomeMessage,
          is_system: true
        });

      if (error) {
        ErrorHandler.logError('CREATE_WELCOME_MESSAGE', error);
        return false;
      }

      console.log('✅ Message de bienvenue créé pour le groupe:', groupId);
      return true;
    } catch (error) {
      ErrorHandler.logError('CREATE_WELCOME_MESSAGE', error);
      return false;
    }
  }

  /**
   * Créer un message système pour confirmer qu'un utilisateur a rejoint
   */
  static async createJoinMessage(groupId: string, userName?: string): Promise<boolean> {
    try {
      const joinMessage = userName 
        ? `${userName} a rejoint le groupe !` 
        : "Un nouvel aventurier a rejoint le groupe !";
      
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // ID système
          message: joinMessage,
          is_system: true
        });

      if (error) {
        ErrorHandler.logError('CREATE_JOIN_MESSAGE', error);
        return false;
      }

      console.log('✅ Message de participation créé pour le groupe:', groupId);
      return true;
    } catch (error) {
      ErrorHandler.logError('CREATE_JOIN_MESSAGE', error);
      return false;
    }
  }

  /**
   * Créer un message système pour confirmer qu'un utilisateur a quitté
   */
  static async createLeaveMessage(groupId: string, userName?: string): Promise<boolean> {
    try {
      const leaveMessage = userName 
        ? `${userName} a quitté le groupe.` 
        : "Un aventurier a quitté le groupe.";
      
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          user_id: '00000000-0000-0000-0000-000000000000', // ID système
          message: leaveMessage,
          is_system: true
        });

      if (error) {
        ErrorHandler.logError('CREATE_LEAVE_MESSAGE', error);
        return false;
      }

      console.log('✅ Message de départ créé pour le groupe:', groupId);
      return true;
    } catch (error) {
      ErrorHandler.logError('CREATE_LEAVE_MESSAGE', error);
      return false;
    }
  }
}
