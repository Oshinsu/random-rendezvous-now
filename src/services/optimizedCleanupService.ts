import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

/**
 * SERVICE DE NETTOYAGE OPTIMISÉ - Plan anti-groupes zombies
 * 
 * Objectifs:
 * 1. Définition stricte d'un groupe "actif" (participants actifs dans les 2 dernières heures)
 * 2. Filtrage par âge des groupes (exclure groupes > 3 heures)
 * 3. Nettoyage en temps réel pour supprimer les groupes zombies
 * 4. Priorité à la création de nouveaux groupes
 */
export class OptimizedCleanupService {
  
  /**
   * Nettoyage en temps réel - Exécuté toutes les 30 minutes
   */
  static async runRealtimeCleanup(): Promise<void> {
    try {
      console.log('🧹 [REALTIME CLEANUP] Démarrage nettoyage anti-zombies...');
      
      // 1. Supprimer les participants inactifs (2 heures au lieu de 24h)
      await this.cleanupInactiveParticipants();
      
      // 2. Supprimer les groupes trop anciens pour être rejoints (3 heures)
      await this.cleanupOldGroups();
      
      // 3. Supprimer les groupes vides depuis 30 minutes
      await this.cleanupEmptyGroups();
      
      // 4. Corriger les compteurs et statuts
      await this.correctGroupCounters();
      
      // 5. Nettoyer les groupes terminés (3 heures au lieu de 6h)
      await this.cleanupCompletedGroups();
      
      console.log('✅ [REALTIME CLEANUP] Nettoyage anti-zombies terminé');
    } catch (error) {
      ErrorHandler.logError('REALTIME_CLEANUP', error);
      console.error('❌ [REALTIME CLEANUP] Erreur:', error);
    }
  }

  /**
   * Suppression AGRESSIVE des participants inactifs (2 heures)
   */
  private static async cleanupInactiveParticipants(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_ACTIVITY_THRESHOLD).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression participants inactifs depuis 2h...');
      
      const { error } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_INACTIVE_PARTICIPANTS_2H', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Participants inactifs (2h+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_INACTIVE_PARTICIPANTS_2H', error);
    }
  }

  /**
   * Suppression des groupes trop anciens pour être rejoints (3 heures)
   */
  private static async cleanupOldGroups(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - GROUP_CONSTANTS.MAX_GROUP_AGE_FOR_JOIN).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression groupes anciens (3h+)...');
      
      // Supprimer les groupes en attente de plus de 3 heures
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .lt('created_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_OLD_GROUPS_3H', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Groupes anciens (3h+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_OLD_GROUPS_3H', error);
    }
  }

  /**
   * Suppression des groupes vides depuis 30 minutes
   */
  private static async cleanupEmptyGroups(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - GROUP_CONSTANTS.CLEANUP_THRESHOLDS.EMPTY_GROUPS).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression groupes vides (30min+)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('current_participants', 0)
        .lt('created_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_EMPTY_GROUPS', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Groupes vides (30min+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_EMPTY_GROUPS', error);
    }
  }

  /**
   * Correction des compteurs avec logique de nettoyage intégrée
   */
  private static async correctGroupCounters(): Promise<void> {
    try {
      console.log('📊 [REALTIME CLEANUP] Correction compteurs avec nettoyage...');
      
      const { data: groups, error: fetchError } = await supabase
        .from('groups')
        .select('id, current_participants, status, created_at')
        .in('status', ['waiting', 'confirmed']);

      if (fetchError) {
        ErrorHandler.logError('FETCH_GROUPS_FOR_COUNTER_CORRECTION', fetchError);
        return;
      }

      if (!groups) return;

      for (const group of groups) {
        // Compter seulement les participants ACTIFS (2 heures)
        const activeThreshold = new Date(Date.now() - GROUP_CONSTANTS.PARTICIPANT_ACTIVITY_THRESHOLD).toISOString();
        
        const { data: activeParticipants } = await supabase
          .from('group_participants')
          .select('id')
          .eq('group_id', group.id)
          .eq('status', 'confirmed')
          .gt('last_seen', activeThreshold);

        const realActiveCount = activeParticipants?.length || 0;
        
        if (realActiveCount !== group.current_participants) {
          console.log(`🔧 [REALTIME CLEANUP] Correction groupe ${group.id}: ${group.current_participants} → ${realActiveCount} participants actifs`);
          
          let updateData: any = {
            current_participants: realActiveCount
          };

          // Si le groupe devient vide, le supprimer immédiatement
          if (realActiveCount === 0) {
            await supabase
              .from('groups')
              .delete()
              .eq('id', group.id);
            console.log(`🗑️ [REALTIME CLEANUP] Groupe vide supprimé: ${group.id}`);
            continue;
          }

          // Si un groupe confirmé passe sous 5 participants actifs, le remettre en attente
          if (realActiveCount < 5 && group.status === 'confirmed') {
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
            console.log(`⏳ [REALTIME CLEANUP] Groupe remis en attente (participants actifs < 5): ${group.id}`);
          }

          await supabase
            .from('groups')
            .update(updateData)
            .eq('id', group.id);
        }
      }
      
      console.log('✅ [REALTIME CLEANUP] Compteurs corrigés avec participants actifs');
    } catch (error) {
      ErrorHandler.logError('CORRECT_GROUP_COUNTERS_ACTIVE', error);
    }
  }

  /**
   * Nettoyage des groupes terminés (3 heures au lieu de 6h)
   */
  private static async cleanupCompletedGroups(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - GROUP_CONSTANTS.CLEANUP_THRESHOLDS.COMPLETED_GROUPS).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression groupes terminés (3h+ après meeting)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'confirmed')
        .not('meeting_time', 'is', null)
        .lt('meeting_time', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS_3H', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Groupes terminés (3h+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS_3H', error);
    }
  }

  /**
   * Démarrage du nettoyage périodique automatique (toutes les 30 minutes)
   */
  static startPeriodicRealtimeCleanup(): void {
    console.log('⏰ [REALTIME CLEANUP] Démarrage nettoyage périodique (toutes les 30 minutes)');
    
    // Nettoyage immédiat
    this.runRealtimeCleanup();
    
    // Puis nettoyage toutes les 30 minutes
    setInterval(() => {
      this.runRealtimeCleanup();
    }, GROUP_CONSTANTS.CLEANUP_FREQUENCY);
  }

  /**
   * Vérification si un groupe est "actif" selon les nouveaux critères
   */
  static isGroupActive(group: any): boolean {
    if (!group) return false;
    
    // Vérifier l'âge du groupe (max 3 heures)
    const groupAge = Date.now() - new Date(group.created_at).getTime();
    if (groupAge > GROUP_CONSTANTS.MAX_GROUP_AGE_FOR_JOIN) {
      return false;
    }
    
    // Vérifier le statut
    if (!['waiting', 'confirmed'].includes(group.status)) {
      return false;
    }
    
    return true;
  }

  /**
   * Filtrage des groupes actifs pour la recherche
   */
  static filterActiveGroups(groups: any[]): any[] {
    return groups.filter(group => this.isGroupActive(group));
  }
}