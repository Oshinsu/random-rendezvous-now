
import { supabase } from '@/integrations/supabase/client';
import { ErrorHandler } from '@/utils/errorHandling';
import { GROUP_CONSTANTS } from '@/constants/groupConstants';

export class PeriodicCleanupService {
  // Service de nettoyage périodique RÉALISTE pour usage normal
  static async runPeriodicCleanup(): Promise<void> {
    try {
      console.log('🕐 [PERIODIC] Démarrage du nettoyage périodique RÉALISTE...');
      
      // 1. Supprimer les participants inactifs depuis le seuil défini (6 heures)
      const cleanupThreshold = new Date(Date.now() - GROUP_CONSTANTS.PERIODIC_CLEANUP_THRESHOLD).toISOString();
      
      const { error: cleanupParticipantsError } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', cleanupThreshold);

      if (cleanupParticipantsError) {
        ErrorHandler.logError('PERIODIC_CLEANUP_PARTICIPANTS', cleanupParticipantsError);
      } else {
        console.log('✅ [PERIODIC] Participants inactifs (6h+) supprimés');
      }

      // 2. Corriger les compteurs après suppression des participants
      const { data: groups, error: fetchGroupsError } = await supabase
        .from('groups')
        .select('id, current_participants, status')
        .in('status', ['waiting', 'confirmed']);

      if (fetchGroupsError) {
        ErrorHandler.logError('PERIODIC_CLEANUP_FETCH_GROUPS', fetchGroupsError);
      } else if (groups) {
        for (const group of groups) {
          const { data: participants } = await supabase
            .from('group_participants')
            .select('id')
            .eq('group_id', group.id)
            .eq('status', 'confirmed');

          const realCount = participants?.length || 0;
          
          if (realCount !== group.current_participants) {
            console.log(`📊 [PERIODIC] Correction compteur groupe ${group.id}: ${group.current_participants} → ${realCount}`);
            
            let updateData: any = {
              current_participants: realCount
            };

            // Si le groupe devient vide, le supprimer
            if (realCount === 0) {
              await supabase
                .from('groups')
                .delete()
                .eq('id', group.id);
              console.log(`🗑️ [PERIODIC] Groupe vide supprimé: ${group.id}`);
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
              console.log(`⏳ [PERIODIC] Groupe remis en attente: ${group.id}`);
            }

            await supabase
              .from('groups')
              .update(updateData)
              .eq('id', group.id);
          }
        }
      }

      // 3. Supprimer les groupes en attente vides ET très anciens (12 heures au lieu de 48h)
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      
      const { error: cleanupWaitingError } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .eq('current_participants', 0)
        .lt('created_at', twelveHoursAgo);

      if (cleanupWaitingError) {
        ErrorHandler.logError('PERIODIC_CLEANUP_WAITING', cleanupWaitingError);
      } else {
        console.log('✅ [PERIODIC] Groupes en attente vides et anciens (12h+) supprimés');
      }

      // 4. Supprimer les groupes terminés (6 heures après meeting_time)
      const sixHoursAfterMeetingAgo = new Date(Date.now() - GROUP_CONSTANTS.PERIODIC_CLEANUP_THRESHOLD).toISOString();
      
      const { error: cleanupCompletedError } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'confirmed')
        .not('meeting_time', 'is', null)
        .lt('meeting_time', sixHoursAfterMeetingAgo);

      if (cleanupCompletedError) {
        ErrorHandler.logError('PERIODIC_CLEANUP_COMPLETED', cleanupCompletedError);
      } else {
        console.log('✅ [PERIODIC] Groupes terminés (6h+ après meeting) supprimés');
      }

      // 5. Appeler la fonction de nettoyage de la base de données
      const { error: rpcError } = await supabase.rpc('dissolve_old_groups');
      
      if (rpcError) {
        ErrorHandler.logError('PERIODIC_CLEANUP_RPC', rpcError);
      } else {
        console.log('✅ [PERIODIC] Fonction de nettoyage DB appelée');
      }

      console.log('✅ [PERIODIC] Nettoyage périodique RÉALISTE terminé avec succès');
    } catch (error) {
      ErrorHandler.logError('PERIODIC_CLEANUP_SERVICE', error);
      console.error('❌ [PERIODIC] Erreur dans le nettoyage périodique:', error);
    }
  }

  // Méthode pour démarrer le nettoyage périodique automatique (toutes les 2 heures)
  static startPeriodicCleanup(): void {
    console.log('🕐 [PERIODIC] Démarrage du nettoyage périodique automatique (toutes les 2 heures)');
    
    // Nettoyage immédiat
    this.runPeriodicCleanup();
    
    // Puis nettoyage toutes les 2 heures (plus réaliste)
    setInterval(() => {
      this.runPeriodicCleanup();
    }, 2 * 60 * 60 * 1000); // 2 heures
  }

  // Méthode pour forcer un nettoyage manuel
  static async forceCleanup(): Promise<void> {
    console.log('🧹 [PERIODIC] Nettoyage manuel forcé...');
    await this.runPeriodicCleanup();
  }
}
