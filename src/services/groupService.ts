
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { LocationData } from '@/services/geolocation';

export class GroupService {
  static async cleanupInactiveParticipants(): Promise<void> {
    try {
      console.log('🧹 Nettoyage des participants inactifs (>5min)');
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: inactiveParticipants, error: selectError } = await supabase
        .from('group_participants')
        .select('group_id, user_id')
        .lt('last_seen', fiveMinutesAgo);

      if (selectError) {
        console.error('❌ Erreur sélection participants inactifs:', selectError);
        return;
      }

      if (!inactiveParticipants || inactiveParticipants.length === 0) {
        console.log('✅ Aucun participant inactif à nettoyer');
        return;
      }

      console.log(`🗑️ ${inactiveParticipants.length} participants inactifs trouvés`);

      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', fiveMinutesAgo);

      if (deleteError) {
        console.error('❌ Erreur suppression participants inactifs:', deleteError);
        return;
      }

      const affectedGroups = [...new Set(inactiveParticipants.map(p => p.group_id))];
      
      for (const groupId of affectedGroups) {
        const { data: activeParticipants } = await supabase
          .from('group_participants')
          .select('id')
          .eq('group_id', groupId)
          .eq('status', 'confirmed');

        const activeCount = activeParticipants?.length || 0;
        
        await supabase
          .from('groups')
          .update({ current_participants: activeCount })
          .eq('id', groupId);

        console.log(`🔄 Groupe ${groupId}: ${activeCount} participants actifs`);
      }

      console.log('✅ Nettoyage des participants inactifs terminé');
    } catch (error) {
      console.error('❌ Erreur cleanupInactiveParticipants:', error);
    }
  }

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

  static async verifyAuth(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }
}
