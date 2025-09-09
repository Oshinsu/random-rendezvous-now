import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GroupService } from './groupService';
import type { Group } from '@/types/database';
import type { LocationData } from '@/services/geolocation';
import { getSearchRadius } from '@/utils/searchRadiusUtils';
import { getGroupLocation } from '@/utils/parisRedirection';
import type { GroupMember } from '@/types/groups';

export class SimpleGroupService {
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      console.log('🔍 Récupération des groupes utilisateur pour:', userId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non authentifié');
        return [];
      }

      await GroupService.cleanupInactiveParticipants();

      const { data: participations, error: participationError } = await supabase
        .from('group_participants')
        .select(`
          group_id,
          groups (
            id,
            created_at,
            status,
            bar_name,
            bar_address,
            meeting_time,
            max_participants,
            current_participants,
            latitude,
            longitude,
            location_name,
            search_radius,
            bar_latitude,
            bar_longitude,
            bar_place_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (participationError) {
        console.error('❌ Erreur récupération participations:', participationError);
        return [];
      }

      if (!participations || participations.length === 0) {
        console.log('ℹ️ Aucune participation trouvée pour l\'utilisateur');
        return [];
      }

      const groups = participations
        .map(p => p.groups)
        .filter(group => group && ['waiting', 'confirmed', 'full'].includes(group.status))
        .map(group => ({
          ...group,
          id: group.id,
          created_at: group.created_at,
          status: group.status,
          bar_name: group.bar_name,
          bar_address: group.bar_address,
          meeting_time: group.meeting_time,
          max_participants: group.max_participants,
          current_participants: group.current_participants,
          latitude: group.latitude,
          longitude: group.longitude,
          location_name: group.location_name,
          search_radius: group.search_radius,
          bar_latitude: group.bar_latitude,
          bar_longitude: group.bar_longitude,
          bar_place_id: group.bar_place_id
        })) as Group[];

      console.log('✅ Groupes récupérés:', groups.length);
      
      return groups;
    } catch (error) {
      console.error('❌ Erreur getUserGroups:', error);
      return [];
    }
  }

  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 Récupération des membres du groupe:', groupId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non authentifié');
        return [];
      }

      await GroupService.cleanupInactiveParticipants();

      const { data: participants, error } = await supabase
        .from('group_participants')
        .select(`
          id,
          user_id,
          status,
          joined_at,
          last_seen,
          latitude,
          longitude,
          location_name
        `)
        .eq('group_id', groupId)
        .eq('status', 'confirmed')
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération membres:', error);
        return [];
      }

      console.log('✅ Membres actifs récupérés:', participants?.length || 0);

      const members = (participants || []).map((participant, index) => {
        console.log(`👤 Membre ${index + 1}: connecté (last_seen: ${participant.last_seen})`);
        
        return {
          id: participant.id,
          name: `Rander ${index + 1}`,
          isConnected: true,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: participant.last_seen
        };
      }) as GroupMember[];

      console.log('📊 RÉSUMÉ MEMBRES:');
      console.log(`  - Total: ${members.length}`);
      console.log(`  - Tous connectés: ${members.length}`);

      return members;
    } catch (error) {
      console.error('❌ Erreur getGroupMembers:', error);
      return [];
    }
  }

  static async createGroup(location: LocationData, userId: string): Promise<boolean> {
    try {
      console.log('🆕 Création de groupe pour utilisateur:', userId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('❌ Utilisateur non authentifié ou ID incorrect');
        toast({ 
          title: 'Erreur d\'authentification', 
          description: 'Veuillez vous reconnecter.', 
          variant: 'destructive' 
        });
        return false;
      }

      const { data: existingParticipations } = await supabase
        .from('group_participants')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (existingParticipations && existingParticipations.length > 0) {
        console.log('ℹ️ Utilisateur déjà dans un groupe actif');
        toast({ 
          title: 'Déjà dans un groupe', 
          description: 'Vous êtes déjà dans un groupe actif.', 
          variant: 'destructive' 
        });
        return false;
      }

      // NOUVEAU: Appliquer la redirection IDF
      const groupLocation = getGroupLocation(location);

      const newGroupData = {
        status: 'waiting' as const,
        max_participants: 5,
        current_participants: 1,
        latitude: groupLocation.latitude,
        longitude: groupLocation.longitude,
        location_name: groupLocation.locationName,
        search_radius: await getSearchRadius()
      };

      console.log('📝 Données du nouveau groupe:', newGroupData);

      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert(newGroupData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création groupe:', createError);
        toast({ 
          title: 'Erreur de création', 
          description: 'Impossible de créer le groupe.', 
          variant: 'destructive' 
        });
        return false;
      }

      console.log('✅ Groupe créé avec ID:', newGroup.id);
      
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          status: 'confirmed' as const,
          last_seen: new Date().toISOString(),
          latitude: groupLocation.latitude,
          longitude: groupLocation.longitude,
          location_name: groupLocation.locationName
        });

      if (joinError) {
        console.error('❌ Erreur ajout participant:', joinError);
        await supabase.from('groups').delete().eq('id', newGroup.id);
        toast({ 
          title: 'Erreur', 
          description: 'Impossible de rejoindre le groupe créé.', 
          variant: 'destructive' 
        });
        return false;
      }

      console.log('✅ Utilisateur ajouté au groupe avec succès');
      toast({ 
        title: '🎉 Groupe créé', 
        description: `Nouveau groupe créé dans votre zone.`
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erreur createGroup:', error);
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de créer un groupe pour le moment.', 
        variant: 'destructive' 
      });
      return false;
    }
  }

  static async joinGroup(groupId: string, userId: string, location: LocationData): Promise<boolean> {
    try {
      console.log('👥 Rejoindre groupe:', groupId, 'par utilisateur:', userId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('❌ Utilisateur non authentifié');
        return false;
      }

      // NOUVEAU: Appliquer la redirection IDF
      const groupLocation = getGroupLocation(location);

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, max_participants, status')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        console.error('❌ Groupe non trouvé:', groupError);
        return false;
      }

      if (group.current_participants >= group.max_participants) {
        toast({ 
          title: 'Groupe complet', 
          description: 'Ce groupe est déjà complet.', 
          variant: 'destructive' 
        });
        return false;
      }

      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: groupId,
          user_id: userId,
          status: 'confirmed' as const,
          last_seen: new Date().toISOString(),
          latitude: groupLocation.latitude,
          longitude: groupLocation.longitude,
          location_name: groupLocation.locationName
        });

      if (joinError) {
        console.error('❌ Erreur rejoindre groupe:', joinError);
        toast({ 
          title: 'Impossible de rejoindre', 
          description: 'Erreur lors de la participation au groupe.', 
          variant: 'destructive' 
        });
        return false;
      }

      const { error: updateError } = await supabase
        .from('groups')
        .update({ current_participants: group.current_participants + 1 })
        .eq('id', groupId);

      if (updateError) {
        console.error('❌ Erreur mise à jour participants:', updateError);
      }

      console.log('✅ Groupe rejoint avec succès');
      toast({ 
        title: '✅ Groupe rejoint', 
        description: 'Vous avez rejoint un groupe avec succès.'
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur joinGroup:', error);
      return false;
    }
  }

  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      console.log('🚪 Quitter groupe:', groupId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        console.error('❌ Utilisateur non authentifié');
        return false;
      }

      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Erreur quitter groupe:', deleteError);
        return false;
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('current_participants')
        .eq('id', groupId)
        .single();

      if (!groupError && group) {
        const { error: updateError } = await supabase
          .from('groups')
          .update({ current_participants: Math.max(0, group.current_participants - 1) })
          .eq('id', groupId);

        if (updateError) {
          console.error('❌ Erreur mise à jour participants:', updateError);
        }
      }

      console.log('✅ Groupe quitté avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur leaveGroup:', error);
      return false;
    }
  }

  static async findNearbyGroups(location: LocationData): Promise<Group[]> {
    try {
      console.log('🔍 Recherche groupes à proximité');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ Utilisateur non authentifié');
        return [];
      }

      const { data: groups, error } = await supabase
        .from('groups')
        .select('*')
        .eq('status', 'waiting')
        .lt('current_participants', 5)
        .limit(10);

      if (error) {
        console.error('❌ Erreur recherche groupes:', error);
        return [];
      }

      console.log('✅ Groupes trouvés:', groups?.length || 0);
      return (groups || []) as Group[];
    } catch (error) {
      console.error('❌ Erreur findNearbyGroups:', error);
      return [];
    }
  }

  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        return;
      }

      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erreur mise à jour activité:', error);
      } else {
        console.log('✅ Activité utilisateur mise à jour');
      }
    } catch (error) {
      console.error('❌ Erreur updateUserActivity:', error);
    }
  }

  static async verifyAuth(): Promise<boolean> {
    return GroupService.verifyAuth();
  }
}
