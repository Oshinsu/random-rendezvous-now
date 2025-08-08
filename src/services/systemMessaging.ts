
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';

export class SystemMessagingService {
  /**
   * Créer un message de bienvenue automatique pour un nouveau groupe
   */
  static async createWelcomeMessage(groupId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('system-messaging', {
        body: {
          action: 'welcome',
          group_id: groupId
        }
      });

      if (error || !(data as any)?.success) {
        ErrorHandler.logError('CREATE_WELCOME_MESSAGE', error || (data as any));
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
      
      const { data, error } = await supabase.functions.invoke('system-messaging', {
        body: {
          action: 'join',
          group_id: groupId,
          user_name: userName
        }
      });

      if (error || !(data as any)?.success) {
        ErrorHandler.logError('CREATE_JOIN_MESSAGE', error || (data as any));
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
      
      const { data, error } = await supabase.functions.invoke('system-messaging', {
        body: {
          action: 'leave',
          group_id: groupId,
          user_name: userName
        }
      });

      if (error || !(data as any)?.success) {
        ErrorHandler.logError('CREATE_LEAVE_MESSAGE', error || (data as any));
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
