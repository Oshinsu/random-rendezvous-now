import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

/**
 * SERVICE DE NETTOYAGE INTELLIGENT - Protection des groupes vivants
 * 
 * Plan intelligent:
 * 1. Protéger complètement les groupes "vivants" (récents et actifs)
 * 2. Nettoyer uniquement les groupes vraiment abandonnés
 * 3. Distinction entre "connecté", "en attente", et "abandonné"
 * 4. Suppression immédiate des groupes vides
 * 5. Attente réaliste de 1 heure pour formation
 */
export class IntelligentCleanupService {
  
  /**
   * Nettoyage intelligent principal
   */
  static async runIntelligentCleanup(): Promise<void> {
    try {
      console.log('🧠 [INTELLIGENT CLEANUP] Démarrage du nettoyage intelligent...');
      
      // Debug: Compter les groupes planifiés avant nettoyage
      const { data: scheduledGroups } = await supabase
        .from('groups')
        .select('id, is_scheduled, scheduled_for, status')
        .eq('is_scheduled', true);
      
      console.log(`📅 [DEBUG] ${scheduledGroups?.length || 0} groupes planifiés trouvés avant nettoyage:`, 
        scheduledGroups?.map(g => `${g.id.slice(0,8)} (${g.status}, prévu: ${g.scheduled_for})`));
      
      // 1. Identifier et protéger les groupes vivants
      await this.protectLiveGroups();
      
      // 2. Nettoyer immédiatement les groupes vides
      await this.cleanupEmptyGroupsImmediately();
      
      // 3. Nettoyer les participants vraiment abandonnés (6+ heures)
      await this.cleanupAbandonedParticipants();
      
      // 4. Nettoyer les groupes qui ont dépassé le délai d'attente (1 heure)
      await this.cleanupTimedOutGroups();
      
      // 5. Nettoyer les groupes très anciens (24+ heures)
      await this.cleanupVeryOldGroups();
      
      // 6. Corriger les compteurs avec logique intelligente
      await this.correctCountersIntelligently();
      
      // 7. Activer les groupes planifiés arrivés à échéance
      await this.activateScheduledGroups();
      
      // 8. Transition des groupes confirmés terminés
      await this.transitionCompletedGroups();
      
      // Pas d'autres services de nettoyage - ce service est UNIQUE
      
      // Debug: Compter les groupes planifiés après nettoyage
      const { data: scheduledGroupsAfter } = await supabase
        .from('groups')
        .select('id, is_scheduled, scheduled_for, status')
        .eq('is_scheduled', true);
      
      console.log(`📅 [DEBUG] ${scheduledGroupsAfter?.length || 0} groupes planifiés restants après nettoyage:`, 
        scheduledGroupsAfter?.map(g => `${g.id.slice(0,8)} (${g.status}, prévu: ${g.scheduled_for})`));
      
      console.log('✅ [INTELLIGENT CLEANUP] Nettoyage intelligent terminé');
    } catch (error) {
      ErrorHandler.logError('INTELLIGENT_CLEANUP', error);
      console.error('❌ [INTELLIGENT CLEANUP] Erreur:', error);
    }
  }

  /**
   * ÉTAPE 1: Identifier et marquer les groupes vivants (protection totale)
   */
  private static async protectLiveGroups(): Promise<void> {
    try {
      console.log('🛡️ [INTELLIGENT CLEANUP] Identification des groupes vivants...');
      
      // Groupes récents (moins de 30 minutes) = protection totale
      const protectionThreshold = new Date(Date.now() - GROUP_CONSTANTS.ACTIVE_GROUP_PROTECTION).toISOString();
      
      const { data: liveGroups, error } = await supabase
        .from('groups')
        .select('id, status, created_at, current_participants, is_scheduled, scheduled_for')
        .or(`and(created_at.gt.${protectionThreshold},status.in.(waiting,confirmed)),and(is_scheduled.eq.true,scheduled_for.gt.${new Date().toISOString()},status.neq.cancelled)`);
      
      console.log(`🛡️ [DEBUG] Protection des groupes vivants - Seuil: ${protectionThreshold}`);

      if (error) {
        ErrorHandler.logError('IDENTIFY_LIVE_GROUPS', error);
        return;
      }

      if (liveGroups && liveGroups.length > 0) {
        const recentGroups = liveGroups.filter(g => !g.is_scheduled);
        const scheduledGroups = liveGroups.filter(g => g.is_scheduled);
        
        console.log(`🛡️ [INTELLIGENT CLEANUP] ${recentGroups.length} groupes récents protégés, ${scheduledGroups.length} groupes planifiés protégés`);
        
        if (recentGroups.length > 0) {
          console.log('📍 Groupes récents:', recentGroups.map(g => 
            `${g.id.slice(0,8)} (${g.current_participants} participants, âge: ${Math.round((Date.now() - new Date(g.created_at).getTime()) / 60000)}min)`));
        }
        
        if (scheduledGroups.length > 0) {
          console.log('📅 Groupes planifiés:', scheduledGroups.map(g => 
            `${g.id.slice(0,8)} (prévu: ${new Date(g.scheduled_for!).toLocaleString()})`));
        }
      }
    } catch (error) {
      ErrorHandler.logError('PROTECT_LIVE_GROUPS', error);
    }
  }

  /**
   * ÉTAPE 2: Suppression IMMÉDIATE des groupes vides (sauf groupes planifiés actifs)
   */
  private static async cleanupEmptyGroupsImmediately(): Promise<void> {
    try {
      console.log('🗑️ [INTELLIGENT CLEANUP] Suppression immédiate des groupes vides...');
      
      // Ne pas supprimer les groupes planifiés même s'ils sont vides
      // CORRECTION CRITIQUE: Syntaxe correcte pour exclure les groupes planifiés
      const { data: deletedGroups, error } = await supabase
        .from('groups')
        .delete()
        .eq('current_participants', 0)
        .not('is_scheduled', 'eq', true)
        .select('id, created_at');
      
      console.log(`🗑️ [DEBUG] Tentative suppression groupes vides - Query: current_participants=0 AND (is_scheduled IS NULL OR is_scheduled = false)`);

      if (error) {
        ErrorHandler.logError('CLEANUP_EMPTY_GROUPS_IMMEDIATELY', error);
      } else if (deletedGroups && deletedGroups.length > 0) {
        console.log(`🗑️ [INTELLIGENT CLEANUP] ${deletedGroups.length} groupes vides supprimés (groupes planifiés protégés)`);
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_EMPTY_GROUPS_IMMEDIATELY', error);
    }
  }

  /**
   * ÉTAPE 3: Nettoyer les participants vraiment abandonnés (6+ heures)
   */
  private static async cleanupAbandonedParticipants(): Promise<void> {
    try {
      console.log('🗑️ [INTELLIGENT CLEANUP] Nettoyage participants abandonnés (6h+)...');
      
      const abandonedThreshold = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_ABANDONED_THRESHOLD).toISOString();
      
      // D'abord, identifier les groupes qui seraient affectés
      const { data: affectedGroups } = await supabase
        .from('group_participants')
        .select('group_id, groups!inner(id, status, created_at)')
        .lt('last_seen', abandonedThreshold)
        .eq('status', 'confirmed');

      // Éviter de nettoyer les participants des groupes protégés (récents)
      const protectionThreshold = new Date(Date.now() - GROUP_CONSTANTS.ACTIVE_GROUP_PROTECTION).toISOString();
      
      // CORRECTION CRITIQUE: Éviter les erreurs SQL UUID avec requête corrigée
      const { data: protectedGroupIds } = await supabase
        .from('groups')
        .select('id')
        .gt('created_at', protectionThreshold)
        .in('status', ['waiting', 'confirmed']);

      const protectedIds = protectedGroupIds?.map(g => g.id) || [];

      const { error } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', abandonedThreshold)
        .not('group_id', 'in', `(${protectedIds.map(id => `'${id}'`).join(',')})`);

      if (error) {
        ErrorHandler.logError('CLEANUP_ABANDONED_PARTICIPANTS', error);
      } else {
        console.log('✅ [INTELLIGENT CLEANUP] Participants abandonnés (6h+) supprimés, groupes vivants protégés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_ABANDONED_PARTICIPANTS', error);
    }
  }

  /**
   * ÉTAPE 4: Nettoyer les groupes qui ont dépassé le délai d'attente (1 heure)
   */
  private static async cleanupTimedOutGroups(): Promise<void> {
    try {
      console.log('⏰ [INTELLIGENT CLEANUP] Nettoyage groupes timeout (1h+)...');
      
      const timeoutThreshold = new Date(Date.now() - GROUP_CONSTANTS.GROUP_FORMATION_TIMEOUT).toISOString();
      
      const { data: timedOutGroups, error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .lt('created_at', timeoutThreshold)
        .select('id, created_at');

      if (error) {
        ErrorHandler.logError('CLEANUP_TIMED_OUT_GROUPS', error);
      } else if (timedOutGroups && timedOutGroups.length > 0) {
        console.log(`⏰ [INTELLIGENT CLEANUP] ${timedOutGroups.length} groupes en attente timeout (1h+) supprimés`);
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_TIMED_OUT_GROUPS', error);
    }
  }

  /**
   * ÉTAPE 5: Nettoyer les groupes très anciens (24+ heures)
   */
  private static async cleanupVeryOldGroups(): Promise<void> {
    try {
      console.log('🗑️ [INTELLIGENT CLEANUP] Nettoyage groupes très anciens (24h+)...');
      
      const veryOldThreshold = new Date(Date.now() - GROUP_CONSTANTS.VERY_OLD_GROUP_THRESHOLD).toISOString();
      
      // Protéger les groupes planifiés même s'ils sont très anciens
      const { data: veryOldGroups, error } = await supabase
        .from('groups')
        .delete()
        .lt('created_at', veryOldThreshold)
        .not('is_scheduled', 'eq', true)
        .select('id, status, created_at');

      if (error) {
        ErrorHandler.logError('CLEANUP_VERY_OLD_GROUPS', error);
      } else if (veryOldGroups && veryOldGroups.length > 0) {
        console.log(`🗑️ [INTELLIGENT CLEANUP] ${veryOldGroups.length} groupes très anciens (24h+) supprimés`);
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_VERY_OLD_GROUPS', error);
    }
  }

  /**
   * ÉTAPE 6: Correction intelligente des compteurs
   */
  private static async correctCountersIntelligently(): Promise<void> {
    try {
      console.log('📊 [INTELLIGENT CLEANUP] Correction intelligente des compteurs...');
      
      const { data: groups, error: fetchError } = await supabase
        .from('groups')
        .select('id, current_participants, status, created_at')
        .in('status', ['waiting', 'confirmed']);

      if (fetchError) {
        ErrorHandler.logError('FETCH_GROUPS_FOR_INTELLIGENT_CORRECTION', fetchError);
        return;
      }

      if (!groups) return;

      for (const group of groups) {
        // Compter tous les participants confirmés (pas de filtre temporel ici)
        const { data: participants } = await supabase
          .from('group_participants')
          .select('id')
          .eq('group_id', group.id)
          .eq('status', 'confirmed');

        const realCount = participants?.length || 0;
        
        if (realCount !== group.current_participants) {
          console.log(`🔧 [INTELLIGENT CLEANUP] Correction groupe ${group.id}: ${group.current_participants} → ${realCount}`);
          
          // Si le groupe devient vide, vérifier s'il est planifié avant suppression
          if (realCount === 0) {
            const { data: groupDetails } = await supabase
              .from('groups')
              .select('is_scheduled, scheduled_for')
              .eq('id', group.id)
              .single();
            
            // Ne pas supprimer les groupes planifiés même s'ils sont vides
            const isScheduledGroup = groupDetails?.is_scheduled && 
              groupDetails?.scheduled_for && 
              new Date(groupDetails.scheduled_for) > new Date();
            
            if (!isScheduledGroup) {
              await supabase
                .from('groups')
                .delete()
                .eq('id', group.id);
              console.log(`🗑️ [INTELLIGENT CLEANUP] Groupe vide supprimé: ${group.id}`);
            } else {
              console.log(`📅 [INTELLIGENT CLEANUP] Groupe planifié vide protégé: ${group.id}`);
            }
            continue;
          }

          let updateData: any = {
            current_participants: realCount
          };

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
            console.log(`⏳ [INTELLIGENT CLEANUP] Groupe remis en attente: ${group.id}`);
          }

          await supabase
            .from('groups')
            .update(updateData)
            .eq('id', group.id);
        }
      }
      
      console.log('✅ [INTELLIGENT CLEANUP] Compteurs corrigés intelligemment');
    } catch (error) {
      ErrorHandler.logError('CORRECT_COUNTERS_INTELLIGENTLY', error);
    }
  }

  /**
   * ÉTAPE 7: Activation des groupes planifiés arrivés à échéance
   */
  private static async activateScheduledGroups(): Promise<void> {
    try {
      console.log('📅 [INTELLIGENT CLEANUP] Activation des groupes planifiés...');
      
      const { data: activatedCount, error } = await supabase.rpc('activate_ready_scheduled_groups');
      
      if (error) {
        ErrorHandler.logError('ACTIVATE_SCHEDULED_GROUPS', error);
      } else {
        console.log(`✅ [INTELLIGENT CLEANUP] ${activatedCount || 0} groupes planifiés activés`);
      }
    } catch (error) {
      ErrorHandler.logError('ACTIVATE_SCHEDULED_GROUPS', error);
    }
  }

  /**
   * ÉTAPE 8: Transition des groupes confirmés terminés
   */
  private static async transitionCompletedGroups(): Promise<void> {
    try {
      console.log('🔄 [INTELLIGENT CLEANUP] Transition des groupes terminés...');
      
      const { error } = await supabase.rpc('transition_groups_to_completed');
      
      if (error) {
        ErrorHandler.logError('TRANSITION_COMPLETED_GROUPS', error);
      } else {
        console.log('✅ [INTELLIGENT CLEANUP] Groupes terminés transférés');
      }
    } catch (error) {
      ErrorHandler.logError('TRANSITION_COMPLETED_GROUPS', error);
    }
  }

  /**
   * Vérification si un groupe est "vivant" selon les nouveaux critères
   */
  static isGroupLive(group: any): boolean {
    if (!group) return false;
    
    // Groupes planifiés avec une date future = toujours vivants
    if (group.is_scheduled && group.scheduled_for && new Date(group.scheduled_for) > new Date()) {
      return true;
    }
    
    // Groupes récents (moins de 30 minutes) = toujours vivants
    const groupAge = Date.now() - new Date(group.created_at).getTime();
    if (groupAge < GROUP_CONSTANTS.ACTIVE_GROUP_PROTECTION) {
      return true;
    }
    
    // Groupes confirmés = toujours vivants
    if (group.status === 'confirmed') {
      return true;
    }
    
    // Groupes en attente mais dans le délai d'1 heure
    if (group.status === 'waiting' && groupAge < GROUP_CONSTANTS.GROUP_FORMATION_TIMEOUT) {
      return true;
    }
    
    return false;
  }

  /**
   * Filtrage des groupes vivants pour l'interface
   */
  static filterLiveGroups(groups: any[]): any[] {
    return groups.filter(group => this.isGroupLive(group));
  }

  /**
   * Démarrage du nettoyage périodique intelligent - SERVICE UNIQUE
   */
  static startPeriodicIntelligentCleanup(): void {
    console.log('⏰ [INTELLIGENT CLEANUP] SEUL SERVICE DE NETTOYAGE ACTIF - Démarrage (30 min)');
    
    // Nettoyage immédiat
    this.runIntelligentCleanup();
    
    // Puis nettoyage toutes les 30 minutes selon GROUP_CONSTANTS.CLEANUP_FREQUENCY
    setInterval(() => {
      this.runIntelligentCleanup();
    }, GROUP_CONSTANTS.CLEANUP_FREQUENCY);
  }

  /**
   * Statistiques des groupes pour debug
   */
  static async getGroupStats(): Promise<any> {
    try {
      const { data: allGroups } = await supabase
        .from('groups')
        .select('id, status, created_at, current_participants');

      if (!allGroups) return null;

      const now = Date.now();
      const stats = {
        total: allGroups.length,
        protected: allGroups.filter(g => now - new Date(g.created_at).getTime() < GROUP_CONSTANTS.ACTIVE_GROUP_PROTECTION).length,
        withinTimeout: allGroups.filter(g => now - new Date(g.created_at).getTime() < GROUP_CONSTANTS.GROUP_FORMATION_TIMEOUT).length,
        veryOld: allGroups.filter(g => now - new Date(g.created_at).getTime() > GROUP_CONSTANTS.VERY_OLD_GROUP_THRESHOLD).length,
        empty: allGroups.filter(g => g.current_participants === 0).length,
        waiting: allGroups.filter(g => g.status === 'waiting').length,
        confirmed: allGroups.filter(g => g.status === 'confirmed').length,
        completed: allGroups.filter(g => g.status === 'completed').length
      };

      console.log('📊 [INTELLIGENT CLEANUP] Stats:', stats);
      return stats;
    } catch (error) {
      ErrorHandler.logError('GET_GROUP_STATS', error);
      return null;
    }
  }
}