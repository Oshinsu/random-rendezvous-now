
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { LocationData } from '@/services/geolocation';

export class GroupService {
  // ❌ SUPPRIMÉ : cleanupInactiveParticipants()
  // Raison : Cette logique est maintenant centralisée dans la fonction PostgreSQL
  // dissolve_old_groups() qui s'exécute toutes les 6 heures via cron.
  // Les seuils de nettoyage sont alignés avec le SSOT get_user_active_groups().
  // Voir CONSTANTES_TEMPORELLES.md pour plus de détails sur l'architecture.

  static async getCurrentParticipantCount(groupId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('status', 'confirmed');

      if (error) {
        console.error('❌ Erreur comptage participants:', error);
        throw error;
      }

      return data ? data.length : 0;
    } catch (error) {
      console.error('❌ Erreur getCurrentParticipantCount:', error);
      throw error;
    }
  }

  static async updateGroupParticipantCount(groupId: string, count: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ current_participants: count })
        .eq('id', groupId);
      
      if (error) {
        console.error('❌ Erreur mise à jour comptage participants:', error);
        throw error;
      }
      
      console.log('✅ Comptage participants mis à jour:', count);
    } catch (error) {
      console.error('❌ Erreur updateGroupParticipantCount:', error);
      throw error;
    }
  }

}
