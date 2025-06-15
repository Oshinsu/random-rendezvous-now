
import { supabase } from '@/integrations/supabase/client';
import { GroupMember } from '@/types/groups';

export class GroupMembersService {
  static isUserConnected(lastSeen: string): boolean {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    // Considérer un utilisateur comme connecté s'il a été vu dans les 10 dernières minutes
    return diffMinutes <= 10;
  }

  static async updateUserLastSeen(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Erreur mise à jour last_seen:', error);
      } else {
        console.log('✅ Last_seen mis à jour pour le groupe:', groupId);
      }
    } catch (error) {
      console.error('❌ Erreur updateUserLastSeen:', error);
    }
  }

  static async forceCleanupOldGroups(): Promise<void> {
    try {
      console.log('🧹 [CLEANUP] Nettoyage forcé des groupes anciens...');
      
      // Appeler la fonction de nettoyage automatique
      const { error } = await supabase.rpc('dissolve_old_groups');
      
      if (error) {
        console.error('❌ [CLEANUP] Erreur lors du nettoyage:', error);
      } else {
        console.log('✅ [CLEANUP] Nettoyage des groupes anciens effectué');
      }
    } catch (error) {
      console.error('❌ [CLEANUP] Erreur forceCleanupOldGroups:', error);
    }
  }

  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      // ÉTAPE 1: FORCER le nettoyage des vieux groupes avant de récupérer les participations
      await this.forceCleanupOldGroups();
      
      console.log('📋 [CLEANUP] Récupération des participations après nettoyage pour:', userId);
      
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          id,
          group_id,
          joined_at,
          status,
          groups!inner(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed']);

      if (error) {
        console.error('❌ Erreur récupération participations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur getUserParticipations:', error);
      return [];
    }
  }

  static async getGroupMembersWithConnectionStatus(groupId: string): Promise<GroupMember[]> {
    return this.fetchGroupMembers(groupId);
  }

  static async fetchGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 [LAST_SEEN] Récupération des membres avec statut de connexion:', groupId);
      
      // ÉTAPE 1: Récupérer TOUS les participants confirmés avec last_seen
      const { data: participantsData, error: participantsError } = await supabase
        .from('group_participants')
        .select(`
          id,
          user_id,
          joined_at,
          status,
          last_seen
        `)
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: true });

      if (participantsError) {
        console.error('❌ Erreur récupération participants:', participantsError);
        throw participantsError;
      }

      const realParticipantCount = participantsData?.length || 0;
      console.log('🔍 [LAST_SEEN] Nombre RÉEL de participants confirmés:', realParticipantCount);

      // ÉTAPE 2: Vérifier le comptage dans la table groups
      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, status')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('❌ Erreur récupération groupe:', groupError);
      } else {
        console.log('📊 [LAST_SEEN] Comptage actuel en BDD:', currentGroup.current_participants, 'vs réel:', realParticipantCount);
        
        // ÉTAPE 3: FORCER la correction si les comptages ne correspondent pas
        if (currentGroup.current_participants !== realParticipantCount) {
          console.log('🚨 [LAST_SEEN] INCOHÉRENCE DÉTECTÉE ! Correction forcée...');
          
          // Déterminer le nouveau statut
          let newStatus = currentGroup.status;
          let updateData: any = {
            current_participants: realParticipantCount
          };

          // Si moins de 5 participants, remettre en waiting et supprimer le bar
          if (realParticipantCount < 5 && currentGroup.status === 'confirmed') {
            newStatus = 'waiting';
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
            console.log('⏳ [LAST_SEEN] Remise en waiting et suppression du bar');
          }

          // Appliquer la correction
          const { error: correctionError } = await supabase
            .from('groups')
            .update(updateData)
            .eq('id', groupId);

          if (correctionError) {
            console.error('❌ [LAST_SEEN] Erreur lors de la correction:', correctionError);
          } else {
            console.log('✅ [LAST_SEEN] Comptage corrigé avec succès:', realParticipantCount);
          }
        }
      }

      if (!participantsData) {
        return [];
      }

      // ÉTAPE 4: Transformer les données avec noms masqués ET statut de connexion
      const members: GroupMember[] = participantsData.map((participant: any, index: number) => {
        const maskedName = `Rander ${index + 1}`;
        const lastSeenValue = participant.last_seen || participant.joined_at;
        const isConnected = GroupMembersService.isUserConnected(lastSeenValue);

        return {
          id: participant.id,
          name: maskedName,
          isConnected: isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: lastSeenValue
        };
      });

      console.log('✅ [LAST_SEEN] Membres finaux avec statut de connexion:', members.map(m => ({ name: m.name, connected: m.isConnected })));
      return members;
    } catch (error) {
      console.error('❌ Erreur fetchGroupMembers:', error);
      return [];
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
        return 0;
      }
      
      return data?.length || 0;
    } catch (error) {
      console.error('❌ Erreur getCurrentParticipantCount:', error);
      return 0;
    }
  }
}
