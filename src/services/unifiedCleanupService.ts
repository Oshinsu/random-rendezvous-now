
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

export class UnifiedCleanupService {
  /**
   * SERVICE DE NETTOYAGE UNIFIÉ - Point d'entrée unique pour toutes les opérations de nettoyage
   */
  static async runUnifiedCleanup(): Promise<void> {
    try {
      console.log('🧹 [UNIFIED CLEANUP] Démarrage du nettoyage unifié complet...');
      
      // 1. Nettoyage des participants inactifs (6 heures)
      await this.cleanupInactiveParticipants();
      
      // 2. Correction des compteurs de tous les groupes
      await this.correctGroupCounters();
      
      // 3. Nettoyage des groupes en attente anciens (12 heures)
      await this.cleanupOldWaitingGroups();
      
      // 4. Nettoyage des groupes terminés (6 heures après meeting)
      await this.cleanupCompletedGroups();
      
      // 5. Appel de la fonction DB pour nettoyage complet
      await this.callDatabaseCleanup();
      
      console.log('✅ [UNIFIED CLEANUP] Nettoyage unifié terminé avec succès');
    } catch (error) {
      ErrorHandler.logError('UNIFIED_CLEANUP_SERVICE', error);
      console.error('❌ [UNIFIED CLEANUP] Erreur dans le nettoyage unifié:', error);
    }
  }

  /**
   * Nettoyage des participants inactifs avec seuil unifié
   */
  private static async cleanupInactiveParticipants(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - GROUP_CONSTANTS.CLEANUP_THRESHOLDS.INACTIVE_PARTICIPANTS).toISOString();
      console.log('🗑️ [UNIFIED CLEANUP] Suppression participants inactifs depuis 6h...');
      
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_INACTIVE_PARTICIPANTS', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Participants inactifs (6h+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_INACTIVE_PARTICIPANTS', error);
    }
  }

  /**
   * Correction unifiée des compteurs de tous les groupes
   */
  private static async correctGroupCounters(): Promise<void> {
    try {
      console.log('📊 [UNIFIED CLEANUP] Correction des compteurs de groupes...');
      
      const { data: groups, error: fetchError } = await supabase
        .from('groups')
        .select('id, current_participants, status')
        .in('status', ['waiting', 'confirmed']);

      if (fetchError) {
        ErrorHandler.logError('FETCH_GROUPS_FOR_CORRECTION', fetchError);
        return;
      }

      if (!groups) return;

      for (const group of groups) {
        const { data: participants } = await supabase
          .from('group_participants')
          .select('id')
          .eq('group_id', group.id)
          .eq('status', 'confirmed');

        const realCount = participants?.length || 0;
        
        if (realCount !== group.current_participants) {
          console.log(`🔧 [UNIFIED CLEANUP] Correction groupe ${group.id}: ${group.current_participants} → ${realCount}`);
          
          let updateData: any = {
            current_participants: realCount
          };

          // Si le groupe devient vide, le marquer pour suppression
          if (realCount === 0) {
            await supabase
              .from('groups')
              .delete()
              .eq('id', group.id);
            console.log(`🗑️ [UNIFIED CLEANUP] Groupe vide supprimé: ${group.id}`);
            continue;
          }

          // Si un groupe confirmé passe sous 5 participants, le remettre en attente
          if (realCount < 5 && group.status === 'confirmed') {
            updateData = {
              ...updateData,
              status: 'waiting',
              bar_name: null,
              bar_address: null,
              meeting_time: null,
              bar_latitude: null,
              bar_longitude: null,
              bar_place_id: null
            };
            console.log(`⏳ [UNIFIED CLEANUP] Groupe remis en attente: ${group.id}`);
          }

          await supabase
            .from('groups')
            .update(updateData)
            .eq('id', group.id);
        }
      }
      
      console.log('✅ [UNIFIED CLEANUP] Compteurs corrigés');
    } catch (error) {
      ErrorHandler.logError('CORRECT_GROUP_COUNTERS', error);
    }
  }

  /**
   * Nettoyage des groupes en attente anciens
   */
  private static async cleanupOldWaitingGroups(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - GROUP_CONSTANTS.CLEANUP_THRESHOLDS.OLD_WAITING_GROUPS).toISOString();
      console.log('🗑️ [UNIFIED CLEANUP] Suppression groupes en attente anciens (12h+)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .eq('current_participants', 0)
        .lt('created_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_OLD_WAITING_GROUPS', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Groupes en attente anciens supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_OLD_WAITING_GROUPS', error);
    }
  }

  /**
   * Nettoyage des groupes terminés
   */
  private static async cleanupCompletedGroups(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - GROUP_CONSTANTS.CLEANUP_THRESHOLDS.COMPLETED_GROUPS).toISOString();
      console.log('🗑️ [UNIFIED CLEANUP] Suppression groupes terminés (6h+ après meeting)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'confirmed')
        .not('meeting_time', 'is', null)
        .lt('meeting_time', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Groupes terminés supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS', error);
    }
  }

  /**
   * Appel de la fonction de nettoyage de la base de données
   */
  private static async callDatabaseCleanup(): Promise<void> {
    try {
      console.log('🔧 [UNIFIED CLEANUP] Appel fonction DB dissolve_old_groups...');
      
      const { error } = await supabase.rpc('dissolve_old_groups');
      
      if (error) {
        ErrorHandler.logError('DATABASE_CLEANUP_RPC', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Fonction DB appelée avec succès');
      }
    } catch (error) {
      ErrorHandler.logError('DATABASE_CLEANUP_RPC', error);
    }
  }

  /**
   * Nettoyage manuel forcé (pour les cas d'urgence)
   */
  static async forceEmergencyCleanup(): Promise<void> {
    console.log('🚨 [UNIFIED CLEANUP] Nettoyage d\'urgence forcé...');
    await this.runUnifiedCleanup();
  }

  /**
   * Démarrage du nettoyage périodique automatique (toutes les 2 heures)
   */
  static startPeriodicCleanup(): void {
    console.log('⏰ [UNIFIED CLEANUP] Démarrage nettoyage périodique (toutes les 2 heures)');
    
    // Nettoyage immédiat
    this.runUnifiedCleanup();
    
    // Puis nettoyage toutes les 2 heures
    setInterval(() => {
      this.runUnifiedCleanup();
    }, 2 * 60 * 60 * 1000); // 2 heures
  }
}
