import { supabase } from '@/integrations/supabase/client';
import { IntelligentHeartbeatService } from './intelligentHeartbeatService';
import { ErrorHandler } from '@/utils/errorHandling';

/**
 * SERVICE DE NOTIFICATIONS INTELLIGENT
 * 
 * Gère les notifications web push pour:
 * - Formation de groupe (participants qui rejoignent)
 * - Groupe confirmé (bar assigné)
 * - Rappels d'attente (après 30 minutes sans confirmation)
 * - Notifications de timeout (avant expiration)
 */
export class NotificationService {
  private static isSupported: boolean = 'Notification' in window;
  private static permission: NotificationPermission = 'default';

  /**
   * Initialisation du service de notifications
   */
  static async initialize(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        console.log('📱 [NOTIFICATIONS] Service push non supporté sur ce navigateur');
        return false;
      }

      // Vérifier la permission actuelle
      this.permission = Notification.permission;
      
      if (this.permission === 'default') {
        // Demander la permission
        this.permission = await Notification.requestPermission();
      }

      if (this.permission === 'granted') {
        console.log('✅ [NOTIFICATIONS] Permissions accordées');
        return true;
      } else {
        console.log('❌ [NOTIFICATIONS] Permissions refusées');
        return false;
      }
    } catch (error) {
      ErrorHandler.logError('NOTIFICATION_INITIALIZATION', error);
      return false;
    }
  }

  /**
   * Envoyer une notification locale
   */
  static async sendNotification(title: string, options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }): Promise<boolean> {
    try {
      if (!this.isSupported || this.permission !== 'granted') {
        console.log('📱 [NOTIFICATIONS] Pas de permission pour notifications');
        return false;
      }

      const notification = new Notification(title, {
        ...options,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        requireInteraction: true // Garde la notification jusqu'à interaction
      });

      // Auto-fermer après 10 secondes si pas d'interaction
      setTimeout(() => {
        notification.close();
      }, 10000);

      console.log('📱 [NOTIFICATIONS] Notification envoyée:', title);
      return true;
    } catch (error) {
      ErrorHandler.logError('SEND_NOTIFICATION', error);
      return false;
    }
  }

  /**
   * Notifier la formation d'un groupe
   */
  static async notifyGroupFormation(groupId: string, currentCount: number, maxCount: number): Promise<void> {
    const title = '🔥 Votre groupe se remplit !';
    const body = `${currentCount}/${maxCount} participants. Plus que ${maxCount - currentCount} place${maxCount - currentCount > 1 ? 's' : ''} !`;
    
    await this.sendNotification(title, {
      body,
      tag: `group-formation-${groupId}`,
      data: { groupId, type: 'formation' }
    });
  }

  /**
   * Notifier la confirmation d'un groupe avec bar assigné
   */
  static async notifyGroupConfirmed(groupId: string, barName: string, meetingTime?: string): Promise<void> {
    const title = '🎉 Votre groupe est confirmé !';
    const timeText = meetingTime ? ` à ${new Date(meetingTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : '';
    const body = `Rendez-vous au ${barName}${timeText} !`;
    
    await this.sendNotification(title, {
      body,
      tag: `group-confirmed-${groupId}`,
      data: { groupId, barName, meetingTime, type: 'confirmed' },
      actions: [
        { action: 'view', title: 'Voir les détails' },
        { action: 'navigate', title: 'Itinéraire' }
      ]
    });
  }

  /**
   * Rappel d'attente après 30 minutes
   */
  static async notifyWaitingReminder(groupId: string, currentCount: number): Promise<void> {
    const title = '⏰ Votre groupe recherche encore...';
    const body = `${currentCount}/5 participants. Restez connecté, ça peut aller vite !`;
    
    await this.sendNotification(title, {
      body,
      tag: `group-waiting-${groupId}`,
      data: { groupId, type: 'waiting' }
    });
  }

  /**
   * Alerte de timeout proche (45 minutes)
   */
  static async notifyTimeoutWarning(groupId: string, remainingMinutes: number): Promise<void> {
    const title = '⚠️ Groupe bientôt expiré';
    const body = `Plus que ${remainingMinutes} minutes pour que votre groupe soit complet. Partagez avec vos amis !`;
    
    await this.sendNotification(title, {
      body,
      tag: `group-timeout-${groupId}`,
      data: { groupId, type: 'timeout-warning' }
    });
  }

  /**
   * Monitorer automatiquement un groupe pour les notifications
   */
  static async startGroupMonitoring(groupId: string): Promise<void> {
    console.log(`📱 [NOTIFICATIONS] Démarrage monitoring groupe: ${groupId}`);

    // Vérifier l'état du groupe toutes les 2 minutes
    const monitoringInterval = setInterval(async () => {
      try {
        const { data: group } = await supabase
          .from('groups')
          .select('id, status, current_participants, max_participants, created_at, bar_name, meeting_time')
          .eq('id', groupId)
          .single();

        if (!group) {
          // Groupe supprimé, arrêter le monitoring
          clearInterval(monitoringInterval);
          return;
        }

        const groupAge = Date.now() - new Date(group.created_at).getTime();
        const minutesOld = Math.floor(groupAge / (1000 * 60));

        // Notifications basées sur l'état
        if (group.status === 'confirmed' && group.bar_name) {
          // Groupe confirmé
          await this.notifyGroupConfirmed(groupId, group.bar_name, group.meeting_time);
          clearInterval(monitoringInterval); // Plus besoin de monitoring
        } else if (group.status === 'waiting') {
          // Notifications d'attente
          if (minutesOld === 30) {
            await this.notifyWaitingReminder(groupId, group.current_participants);
          } else if (minutesOld === 45) {
            const remainingMinutes = 60 - minutesOld;
            await this.notifyTimeoutWarning(groupId, remainingMinutes);
          } else if (group.current_participants >= 3) {
            // Groupe se remplit
            await this.notifyGroupFormation(groupId, group.current_participants, group.max_participants);
          }
        }

        // Arrêter le monitoring si le groupe est trop ancien (1h+ ou completed)
        if (minutesOld > 60 || group.status === 'completed') {
          clearInterval(monitoringInterval);
        }
      } catch (error) {
        ErrorHandler.logError('GROUP_MONITORING', error);
        clearInterval(monitoringInterval);
      }
    }, 2 * 60 * 1000); // Toutes les 2 minutes
  }

  /**
   * Notifier tous les participants actifs d'un groupe
   */
  static async notifyGroupParticipants(groupId: string, title: string, body: string, data?: any): Promise<void> {
    try {
      // Obtenir les participants à notifier (pas abandonnés)
      const participantsToNotify = await IntelligentHeartbeatService.getParticipantsForNotification(groupId);
      
      console.log(`📱 [NOTIFICATIONS] Notification à ${participantsToNotify.length} participants du groupe ${groupId}`);
      
      // Pour l'instant, on envoie juste une notification locale
      // Dans une vraie app, on enverrait via un service push
      await this.sendNotification(title, {
        body,
        tag: `group-broadcast-${groupId}`,
        data: { ...data, groupId, type: 'broadcast' }
      });
    } catch (error) {
      ErrorHandler.logError('NOTIFY_GROUP_PARTICIPANTS', error);
    }
  }

  /**
   * Obtenir le statut des notifications
   */
  static getStatus(): {
    supported: boolean;
    permission: NotificationPermission;
    enabled: boolean;
  } {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.isSupported && this.permission === 'granted'
    };
  }

  /**
   * Tester les notifications
   */
  static async testNotification(): Promise<boolean> {
    return await this.sendNotification('🧪 Test Random', {
      body: 'Les notifications fonctionnent ! Vous recevrez des alertes pour vos groupes.',
      tag: 'test-notification'
    });
  }
}