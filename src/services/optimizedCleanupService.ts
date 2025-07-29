import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

/**
 * SERVICE DE NETTOYAGE OPTIMISÉ - Plan anti-groupes zombies CORRIGÉ
 * 
 * CORRECTIONS PHASE 1:
 * - Élimination des erreurs SQL UUID dans les requêtes
 * - Protection des groupes récents pour éviter les suppressions intempestives
 * - Réduction de la fréquence de nettoyage pour minimiser les erreurs
 */
export class OptimizedCleanupService {
  
  /**
   * Nettoyage en temps réel - Exécuté toutes les 30 minutes AVEC CORRECTIONS
   */
  static async runRealtimeCleanup(): Promise<void> {
    try {
      console.log('🧹 [REALTIME CLEANUP] Démarrage nettoyage anti-zombies CORRIGÉ...');
      
      // 1. Supprimer les participants inactifs (4 heures au lieu de 2h pour plus de sécurité)
      await this.cleanupInactiveParticipants();
      
      // 2. Supprimer les groupes trop anciens pour être rejoints (6 heures au lieu de 3h)
      await this.cleanupOldGroups();
      
      // 3. Supprimer les groupes vides depuis 45 minutes (augmenté)
      await this.cleanupEmptyGroups();
      
      // 4. Corriger les compteurs et statuts avec protection des groupes récents
      await this.correctGroupCounters();
      
      // 5. Nettoyer les groupes terminés (6 heures - standard)
      await this.cleanupCompletedGroups();
      
      console.log('✅ [REALTIME CLEANUP] Nettoyage anti-zombies CORRIGÉ terminé');
    } catch (error) {
      ErrorHandler.logError('REALTIME_CLEANUP', error);
      console.error('❌ [REALTIME CLEANUP] Erreur:', error);
    }
  }

  /**
   * Suppression MODÉRÉE des participants inactifs (4 heures)
   */
  private static async cleanupInactiveParticipants(): Promise<void> {
    try {
      // CORRECTION: 4 heures au lieu de 2h pour réduire les suppressions intempestives
      const threshold = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression participants inactifs depuis 4h...');
      
      // NOUVEAU: Protéger les groupes récents (moins de 30 minutes)
      const protectionThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      // CORRECTION CRITIQUE: Requête corrigée pour éviter les erreurs UUID
      const { data: protectedGroups } = await supabase
        .from('groups')
        .select('id')
        .gt('created_at', protectionThreshold)
        .in('status', ['waiting', 'confirmed']);

      const protectedGroupIds = protectedGroups?.map(g => g.id) || [];

      const { error } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', threshold)
        .not('group_id', 'in', `(${protectedGroupIds.map(id => `'${id}'`).join(',')})`);

      if (error) {
        ErrorHandler.logError('CLEANUP_INACTIVE_PARTICIPANTS_4H', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Participants inactifs (4h+) supprimés (groupes récents protégés)');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_INACTIVE_PARTICIPANTS_4H', error);
    }
  }

  /**
   * Suppression des groupes trop anciens (6 heures au lieu de 3h)
   */
  private static async cleanupOldGroups(): Promise<void> {
    try {
      // CORRECTION: 6 heures au lieu de 3h pour plus de sécurité
      const threshold = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression groupes anciens (6h+)...');
      
      // Supprimer les groupes en attente de plus de 6 heures
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .lt('created_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_OLD_GROUPS_6H', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Groupes anciens (6h+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_OLD_GROUPS_6H', error);
    }
  }

  /**
   * Suppression des groupes vides depuis 45 minutes (augmenté pour sécurité)
   */
  private static async cleanupEmptyGroups(): Promise<void> {
    try {
      // CORRECTION: 45 minutes au lieu de 30 pour éviter les suppressions intempestives
      const threshold = new Date(Date.now() - 45 * 60 * 1000).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression groupes vides (45min+)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('current_participants', 0)
        .lt('created_at', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_EMPTY_GROUPS', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Groupes vides (45min+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_EMPTY_GROUPS', error);
    }
  }

  /**
   * Correction des compteurs avec protection des groupes récents
   */
  private static async correctGroupCounters(): Promise<void> {
    try {
      console.log('📊 [REALTIME CLEANUP] Correction compteurs avec protection...');
      
      const { data: groups, error: fetchError } = await supabase
        .from('groups')
        .select('id, current_participants, status, created_at')
        .in('status', ['waiting', 'confirmed']);

      if (fetchError) {
        ErrorHandler.logError('FETCH_GROUPS_FOR_COUNTER_CORRECTION', fetchError);
        return;
      }

      if (!groups) return;

      const now = Date.now();
      
      for (const group of groups) {
        // NOUVEAU: Protéger les groupes très récents (moins de 10 minutes)
        const groupAge = now - new Date(group.created_at).getTime();
        const isVeryRecent = groupAge < 10 * 60 * 1000; // 10 minutes
        
        // Compter seulement les participants confirmés (sans filtre temporel strict)
        const { data: participants } = await supabase
          .from('group_participants')
          .select('id')
          .eq('group_id', group.id)
          .eq('status', 'confirmed');

        const realCount = participants?.length || 0;
        
        if (realCount !== group.current_participants) {
          console.log(`🔧 [REALTIME CLEANUP] Correction groupe ${group.id}: ${group.current_participants} → ${realCount} (âge: ${Math.round(groupAge/60000)}min)`);
          
          let updateData: any = {
            current_participants: realCount
          };

          // Si le groupe devient vide ET n'est pas très récent, le supprimer
          if (realCount === 0 && !isVeryRecent) {
            await supabase
              .from('groups')
              .delete()
              .eq('id', group.id);
            console.log(`🗑️ [REALTIME CLEANUP] Groupe vide supprimé: ${group.id}`);
            continue;
          } else if (realCount === 0 && isVeryRecent) {
            console.log(`🛡️ [REALTIME CLEANUP] Groupe vide mais récent protégé: ${group.id}`);
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
            console.log(`⏳ [REALTIME CLEANUP] Groupe remis en attente (participants < 5): ${group.id}`);
          }

          await supabase
            .from('groups')
            .update(updateData)
            .eq('id', group.id);
        }
      }
      
      console.log('✅ [REALTIME CLEANUP] Compteurs corrigés avec protection des groupes récents');
    } catch (error) {
      ErrorHandler.logError('CORRECT_GROUP_COUNTERS_PROTECTED', error);
    }
  }

  /**
   * Nettoyage des groupes terminés (6 heures - standard)
   */
  private static async cleanupCompletedGroups(): Promise<void> {
    try {
      const threshold = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      console.log('🗑️ [REALTIME CLEANUP] Suppression groupes terminés (6h+ après meeting)...');
      
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'confirmed')
        .not('meeting_time', 'is', null)
        .lt('meeting_time', threshold);

      if (error) {
        ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS_6H', error);
      } else {
        console.log('✅ [REALTIME CLEANUP] Groupes terminés (6h+) supprimés');
      }
    } catch (error) {
      ErrorHandler.logError('CLEANUP_COMPLETED_GROUPS_6H', error);
    }
  }

  /**
   * Démarrage du nettoyage périodique automatique (toutes les 45 minutes - réduit)
   */
  static startPeriodicRealtimeCleanup(): void {
    console.log('⏰ [REALTIME CLEANUP] Démarrage nettoyage périodique (toutes les 45 minutes)');
    
    // Nettoyage immédiat
    this.runRealtimeCleanup();
    
    // CORRECTION: Fréquence réduite à 45 minutes pour minimiser les erreurs
    setInterval(() => {
      this.runRealtimeCleanup();
    }, 45 * 60 * 1000); // 45 minutes
  }

  /**
   * Vérification si un groupe est "actif" selon les nouveaux critères CORRIGÉS
   */
  static isGroupActive(group: any): boolean {
    if (!group) return false;
    
    // CORRECTION: Âge maximum augmenté à 6 heures
    const groupAge = Date.now() - new Date(group.created_at).getTime();
    if (groupAge > 6 * 60 * 60 * 1000) { // 6 heures
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