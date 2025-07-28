
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

export class UnifiedCleanupService {
  /**
   * SERVICE DE NETTOYAGE UNIFIÉ ULTRA-SÉCURISÉ - Avec protection des groupes en cours d'attribution
   */
  static async runUnifiedCleanup(): Promise<void> {
    try {
      console.log('🧹 [UNIFIED CLEANUP] Démarrage du nettoyage ULTRA-SÉCURISÉ...');
      
      // 0. NOUVEAU: Transition des groupes confirmés vers completed après meeting time
      await this.transitionGroupsToCompleted();
      
      // 1. Nettoyage des participants inactifs (24 heures pour ultra-sécurité)
      await this.cleanupInactiveParticipants();
      
      // 2. Correction des compteurs de tous les groupes
      await this.correctGroupCounters();
      
      // 3. Nettoyage des groupes en attente anciens AVEC DÉLAI ULTRA-AUGMENTÉ (30 minutes)
      await this.cleanupOldWaitingGroups();
      
      // 4. Nettoyage des groupes terminés (6 heures après meeting)
      await this.cleanupCompletedGroups();
      
      // 5. Nettoyage des messages de déclenchement orphelins
      await this.cleanupOrphanTriggerMessages();
      
      // 6. Appel de la fonction DB pour nettoyage complet ultra-sécurisé
      await this.callDatabaseCleanup();
      
      console.log('✅ [UNIFIED CLEANUP] Nettoyage ULTRA-SÉCURISÉ terminé');
    } catch (error) {
      ErrorHandler.logError('UNIFIED_CLEANUP_SERVICE', error);
      console.error('❌ [UNIFIED CLEANUP] Erreur dans le nettoyage unifié:', error);
    }
  }

  /**
   * NOUVEAU: Transition des groupes confirmés vers completed après meeting time
   */
  private static async transitionGroupsToCompleted(): Promise<void> {
    try {
      console.log('🔄 [UNIFIED CLEANUP] Transition groupes confirmés vers completed...');
      
      const { error } = await supabase.rpc('transition_groups_to_completed');
      
      if (error) {
        ErrorHandler.logError('TRANSITION_GROUPS_TO_COMPLETED', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Groupes transférés vers completed');
      }
    } catch (error) {
      ErrorHandler.logError('TRANSITION_GROUPS_TO_COMPLETED', error);
    }
  }

  /**
   * Nettoyage des participants inactifs avec seuil ULTRA-CONSERVATEUR (24 heures)
   */
  private static async cleanupInactiveParticipants(): Promise<void> {
    try {
      // CHANGÉ: 24 heures au lieu de 12 pour ultra-sécurité
      const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      console.log('🗑️ [UNIFIED CLEANUP] Suppression participants inactifs depuis 24h...');
      
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_INACTIVE_PARTICIPANTS', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Participants inactifs (24h+) supprimés');
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

          // Si le groupe devient vide, le marquer pour suppression SEULEMENT après délai ULTRA-AUGMENTÉ
          if (realCount === 0) {
            const { data: groupInfo } = await supabase
              .from('groups')
              .select('created_at')
              .eq('id', group.id)
              .single();
              
            if (groupInfo) {
              const groupAge = Date.now() - new Date(groupInfo.created_at).getTime();
              const minAge = 30 * 60 * 1000; // 30 minutes minimum (ultra-augmenté)
              
              if (groupAge > minAge) {
                await supabase
                  .from('groups')
                  .delete()
                  .eq('id', group.id);
                console.log(`🗑️ [UNIFIED CLEANUP] Groupe vide supprimé (âge: ${Math.round(groupAge/60000)}min): ${group.id}`);
                continue;
              } else {
                console.log(`⏳ [UNIFIED CLEANUP] Groupe vide épargné (trop récent: ${Math.round(groupAge/60000)}min): ${group.id}`);
              }
            }
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
   * Nettoyage des groupes en attente anciens AVEC DÉLAI ULTRA-AUGMENTÉ DE SÉCURITÉ
   */
  private static async cleanupOldWaitingGroups(): Promise<void> {
    try {
      // CHANGÉ: Délai minimum de 30 minutes au lieu de 10 pour ultra-protection
      const threshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      console.log('🗑️ [UNIFIED CLEANUP] Suppression groupes en attente anciens (30min+ ET vides)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .eq('current_participants', 0)
        .lt('created_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_OLD_WAITING_GROUPS', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Groupes en attente anciens (30min+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_OLD_WAITING_GROUPS', error);
    }
  }

  /**
   * Nettoyage des groupes terminés (délai augmenté à 6 heures après completion)
   */
  private static async cleanupCompletedGroups(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(); // 6 heures
      console.log('🗑️ [UNIFIED CLEANUP] Suppression groupes completed (6h+ après completion)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .lt('completed_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Groupes completed supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS', error);
    }
  }

  /**
   * Nettoyage des messages de déclenchement d'attribution automatique orphelins
   */
  private static async cleanupOrphanTriggerMessages(): Promise<void> {
    try {
      console.log('🗑️ [UNIFIED CLEANUP] Nettoyage messages déclenchement orphelins...');
      
      // Supprimer les messages de déclenchement de plus de 5 minutes
      const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('message', 'AUTO_BAR_ASSIGNMENT_TRIGGER')
        .eq('is_system', true)
        .lt('created_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_ORPHAN_TRIGGER_MESSAGES', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Messages déclenchement orphelins supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_ORPHAN_TRIGGER_MESSAGES', error);
    }
  }

  /**
   * Appel de la fonction de nettoyage ultra-sécurisée de la base de données
   */
  private static async callDatabaseCleanup(): Promise<void> {
    try {
      console.log('🔧 [UNIFIED CLEANUP] Appel fonction DB dissolve_old_groups ultra-sécurisée...');
      
      const { error } = await supabase.rpc('dissolve_old_groups');
      
      if (error) {
        ErrorHandler.logError('DATABASE_CLEANUP_RPC', error);
      } else {
        console.log('✅ [UNIFIED CLEANUP] Fonction DB ultra-sécurisée appelée avec succès');
      }
    } catch (error) {
      ErrorHandler.logError('DATABASE_CLEANUP_RPC', error);
    }
  }

  /**
   * Nettoyage manuel forcé (pour les cas d'urgence)
   */
  static async forceEmergencyCleanup(): Promise<void> {
    console.log('🚨 [UNIFIED CLEANUP] Nettoyage d\'urgence forcé ULTRA-SÉCURISÉ...');
    await this.runUnifiedCleanup();
  }

  /**
   * Démarrage du nettoyage périodique automatique ULTRA-CONSERVATEUR (toutes les 6 heures)
   */
  static startPeriodicCleanup(): void {
    console.log('⏰ [UNIFIED CLEANUP] Démarrage nettoyage périodique ULTRA-SÉCURISÉ (toutes les 6 heures)');
    
    // Nettoyage immédiat avec délais ultra-augmentés
    this.runUnifiedCleanup();
    
    // Puis nettoyage toutes les 6 heures (ultra-conservateur)
    setInterval(() => {
      this.runUnifiedCleanup();
    }, 6 * 60 * 60 * 1000); // 6 heures
  }
}
