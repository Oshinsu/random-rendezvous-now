import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Group } from '@/types/database';
import type { LocationData } from '@/services/geolocation';
import type { GroupMember } from '@/types/groups';

export class SimpleGroupService {
  static async getUserGroups(userId: string): Promise<Group[]> {
    try {
      console.log('🔍 Récupération des groupes utilisateur');
      
      // Récupérer les participations de l'utilisateur
      const { data: participations, error: participationError } = await supabase
        .from('group_participants')
        .select('group_id')
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (participationError) {
        console.error('❌ Erreur récupération participations:', participationError);
        return [];
      }

      if (!participations || participations.length === 0) {
        return [];
      }

      // Récupérer les détails des groupes
      const groupIds = participations.map(p => p.group_id);
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .in('status', ['waiting', 'confirmed']);

      if (groupsError) {
        console.error('❌ Erreur récupération groupes:', groupsError);
        return [];
      }

      console.log('✅ Groupes récupérés:', groups?.length || 0);
      return (groups || []) as Group[];
    } catch (error) {
      console.error('❌ Erreur getUserGroups:', error);
      return [];
    }
  }

  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
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
        .eq('status', 'confirmed');

      if (error) {
        console.error('❌ Erreur récupération membres:', error);
        return [];
      }

      return (participants || []).map((participant, index) => ({
        id: participant.id,
        name: `Rander ${index + 1}`, // Map to 'name' property
        isConnected: participant.last_seen ? 
          new Date(participant.last_seen).getTime() > Date.now() - 5 * 60 * 1000 : false, // Map to 'isConnected'
        joinedAt: participant.joined_at, // Map to 'joinedAt'
        status: participant.status as 'confirmed' | 'pending',
        lastSeen: participant.last_seen
      })) as GroupMember[];
    } catch (error) {
      console.error('❌ Erreur getGroupMembers:', error);
      return [];
    }
  }

  static async createGroup(location: LocationData, userId: string): Promise<boolean> {
    try {
      console.log('🆕 Création de groupe');
      
      const newGroupData = {
        status: 'waiting' as const,
        max_participants: 5,
        current_participants: 1,
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: location.locationName,
        search_radius: 10000
      };

      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert(newGroupData)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur création groupe:', createError);
        throw createError;
      }

      console.log('✅ Groupe créé:', newGroup.id);
      
      // Ajouter l'utilisateur au groupe
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: newGroup.id,
          user_id: userId,
          status: 'confirmed' as const,
          last_seen: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          location_name: location.locationName
        });

      if (joinError) {
        console.error('❌ Erreur ajout participant:', joinError);
        return false;
      }

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
      console.log('👥 Rejoindre groupe:', groupId);

      // Vérifier si le groupe existe et n'est pas plein
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

      // Ajouter l'utilisateur au groupe
      const { error: joinError } = await supabase
        .from('group_participants')
        .insert({
          group_id: groupId,
          user_id: userId,
          status: 'confirmed' as const,
          last_seen: new Date().toISOString(),
          latitude: location.latitude,
          longitude: location.longitude,
          location_name: location.locationName
        });

      if (joinError) {
        console.error('❌ Erreur rejoindre groupe:', joinError);
        return false;
      }

      // Mettre à jour le nombre de participants
      const { error: updateError } = await supabase
        .from('groups')
        .update({ current_participants: group.current_participants + 1 })
        .eq('id', groupId);

      if (updateError) {
        console.error('❌ Erreur mise à jour participants:', updateError);
      }

      console.log('✅ Groupe rejoint avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur joinGroup:', error);
      return false;
    }
  }

  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      console.log('🚪 Quitter groupe:', groupId);

      // Supprimer la participation
      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Erreur quitter groupe:', deleteError);
        return false;
      }

      // Mettre à jour le nombre de participants
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

      return (groups || []) as Group[];
    } catch (error) {
      console.error('❌ Erreur findNearbyGroups:', error);
      return [];
    }
  }

  static async updateUserActivity(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erreur mise à jour activité:', error);
      }
    } catch (error) {
      console.error('❌ Erreur updateUserActivity:', error);
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
