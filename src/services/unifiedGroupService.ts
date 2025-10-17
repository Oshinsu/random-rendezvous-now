import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from './geolocation';
import { ErrorHandler } from '@/utils/errorHandling';
import { SystemMessagingService } from './systemMessaging';
import { AutomaticBarAssignmentService } from './automaticBarAssignment';
import { toast } from '@/hooks/use-toast';
import { getGroupLocation } from '@/utils/parisRedirection';
import type { Group, GroupParticipant } from '@/types/database';
import type { GroupMember } from '@/types/groups';

/**
 * SERVICE UNIFIÉ DE GESTION DES GROUPES
 * 
 * Service principal consolidé pour toutes les opérations de groupe
 * - Gestion des participations utilisateurs
 * - Récupération des membres avec statut de connexion
 * - Création et adhésion aux groupes
 * - Synchronisation des comptages
 */

export class UnifiedGroupService {
  // Note: Cette fonction utilise la même logique que la fonction PostgreSQL
  // is_user_connected_realtime() pour garantir la cohérence frontend/backend
  static isUserConnected(lastSeen: string): boolean {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    const CONNECTION_THRESHOLD_MINUTES = 60; // Aligné avec is_user_connected_realtime() et HEARTBEAT_INTERVAL
    return diffMinutes <= CONNECTION_THRESHOLD_MINUTES;
  }

  static async updateUserLastSeen(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', userId);
      
      if (error) {
        ErrorHandler.logError('UPDATE_LAST_SEEN', error);
      } else {
        console.log('✅ Last_seen mis à jour pour le groupe:', groupId);
      }
    } catch (error) {
      ErrorHandler.logError('UPDATE_USER_LAST_SEEN', error);
    }
  }

  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      console.log('📋 [SSOT] Appel de get_user_active_groups pour:', userId);
      
      // PHASE 3: Utiliser la SSOT PostgreSQL au lieu de dupliquer la logique
      const { data, error } = await supabase.rpc('get_user_active_groups', {
        user_uuid: userId,
        include_scheduled: false
      });

      if (error) {
        ErrorHandler.logError('FETCH_USER_PARTICIPATIONS_SSOT', error);
        const appError = ErrorHandler.handleSupabaseError(error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }

      // Transformer les données pour correspondre au format attendu
      const participations = (data || []).map((row: any) => ({
        id: row.participation_id,
        group_id: row.group_id,
        joined_at: row.joined_at,
        status: 'confirmed',
        last_seen: row.last_seen,
        groups: {
          id: row.group_id,
          status: row.group_status,
          created_at: row.created_at,
          current_participants: row.current_participants,
          max_participants: row.max_participants,
          latitude: row.latitude,
          longitude: row.longitude,
          location_name: row.location_name,
          search_radius: row.search_radius,
          bar_name: row.bar_name,
          bar_address: row.bar_address,
          meeting_time: row.meeting_time,
          bar_latitude: row.bar_latitude,
          bar_longitude: row.bar_longitude,
          bar_place_id: row.bar_place_id
        }
      }));

      console.log('✅ [SSOT] Participations actives trouvées:', participations.length);
      return participations;
    } catch (error) {
      ErrorHandler.logError('GET_USER_PARTICIPATIONS', error);
      return [];
    }
  }

  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      console.log('👥 Récupération des membres avec statut de connexion:', groupId);
      
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
        ErrorHandler.logError('FETCH_GROUP_MEMBERS', participantsError);
        const appError = ErrorHandler.handleSupabaseError(participantsError);
        ErrorHandler.showErrorToast(appError);
        return [];
      }

      const realParticipantCount = participantsData?.length || 0;
      console.log('🔍 Nombre RÉEL de participants confirmés:', realParticipantCount);

      // Le comptage est géré automatiquement par le trigger PostgreSQL handle_group_participant_changes_ppu
      // Pas besoin de "correction forcée" manuelle qui créerait une boucle infinie avec Realtime

      if (!participantsData) {
        return [];
      }

      const members: GroupMember[] = participantsData.map((participant: any, index: number) => {
        const maskedName = `Rander ${index + 1}`;
        const lastSeenValue = participant.last_seen || participant.joined_at;
        const isConnected = this.isUserConnected(lastSeenValue);

        return {
          id: participant.id,
          name: maskedName,
          isConnected: isConnected,
          joinedAt: participant.joined_at,
          status: participant.status as 'confirmed' | 'pending',
          lastSeen: lastSeenValue
        };
      });

      console.log('✅ Membres finaux avec statut de connexion:', members.map(m => ({ name: m.name, connected: m.isConnected })));
      return members;
    } catch (error) {
      ErrorHandler.logError('GET_GROUP_MEMBERS', error);
      return [];
    }
  }

  static async verifyUserAuthentication(): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        ErrorHandler.logError('AUTH_CHECK', error);
        return false;
      }
      
      return !!user;
    } catch (error) {
      ErrorHandler.logError('AUTH_VERIFICATION', error);
      return false;
    }
  }

  static async createGroup(userLocation: LocationData, userId: string): Promise<Group | null> {
    try {
      console.log('🔐 Création ATOMIQUE d\'un nouveau groupe avec fonction PostgreSQL sécurisée');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Vous devez être connecté pour créer un groupe.',
          variant: 'destructive'
        });
        return null;
      }

      // CRITIQUE: Double-sanitisation des coordonnées avant traitement
      const { CoordinateValidator } = await import('@/utils/coordinateValidation');
      const validation = CoordinateValidator.validateCoordinates(userLocation.latitude, userLocation.longitude);
      
      if (!validation.isValid || !validation.sanitized) {
        console.error('❌ Coordonnées invalides pour création de groupe');
        toast({
          title: 'Coordonnées invalides',
          description: 'Les coordonnées de géolocalisation sont invalides.',
          variant: 'destructive'
        });
        return null;
      }

      // Utiliser les coordonnées sanitisées
      const sanitizedLocation: LocationData = {
        latitude: validation.sanitized.latitude,
        longitude: validation.sanitized.longitude,
        locationName: userLocation.locationName
      };

      console.log('🔧 Coordonnées double-sanitisées pour création groupe:', validation.sanitized);

      // Application de la redirection IDF
      const groupLocation = getGroupLocation(sanitizedLocation);
      
      if (groupLocation.locationName === 'Paris Centre') {
        console.log('🗺️ Utilisateur IDF - création de groupe parisien');
      }

      // Transaction atomique avec fonction PostgreSQL
      const { data: result, error: transactionError } = await supabase.rpc('create_group_with_participant', {
        p_latitude: groupLocation.latitude,
        p_longitude: groupLocation.longitude,
        p_location_name: groupLocation.locationName,
        p_user_id: userId
      });

      if (transactionError) {
        console.error('❌ Erreur transaction atomique:', transactionError);
        
        if (transactionError.message.includes('User is already in an active group')) {
          toast({
            title: 'Participation limitée',
            description: 'Vous ne pouvez être que dans un seul groupe actif à la fois.',
            variant: 'destructive'
          });
        } else if (transactionError.message.includes('Invalid coordinates')) {
          toast({
            title: 'Coordonnées invalides',
            description: 'Les coordonnées de géolocalisation sont invalides.',
            variant: 'destructive'
          });
        } else {
          const appError = ErrorHandler.handleSupabaseError(transactionError);
          ErrorHandler.showErrorToast(appError);
        }
        return null;
      }

      if (!result || result.length === 0) {
        console.error('❌ Aucun résultat de la transaction atomique');
        toast({
          title: 'Erreur de création',
          description: 'Impossible de créer le groupe pour le moment.',
          variant: 'destructive'
        });
        return null;
      }

      const newGroup = result[0];
      console.log('✅ Groupe créé avec transaction atomique sécurisée:', newGroup.id);
      
      const typedGroup: Group = {
        ...newGroup,
        status: newGroup.status as Group['status']
      };
      
      return typedGroup;
    } catch (error) {
      ErrorHandler.logError('CREATE_GROUP_ATOMIC', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return null;
    }
  }

  static async joinGroup(groupId: string, userId: string, userLocation: LocationData): Promise<boolean> {
    try {
      console.log('🔐 Adhésion au groupe avec vérification de sécurité:', groupId);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Vous devez être connecté pour rejoindre un groupe.',
          variant: 'destructive'
        });
        return false;
      }

      // Vérification de l'existence du groupe
      const { data: groupExists, error: checkGroupError } = await supabase
        .from('groups')
        .select('id, status, current_participants, max_participants')
        .eq('id', groupId)
        .single();

      if (checkGroupError || !groupExists) {
        console.error('❌ Groupe inexistant ou inaccessible:', groupId);
        toast({
          title: 'Groupe introuvable',
          description: 'Ce groupe n\'existe plus ou n\'est plus accessible.',
          variant: 'destructive'
        });
        return false;
      }

      if (groupExists.current_participants >= groupExists.max_participants) {
        toast({
          title: 'Groupe complet',
          description: 'Ce groupe a atteint sa capacité maximale.',
          variant: 'destructive'
        });
        return false;
      }

      // Vérifier participation existante
      const { data: existingParticipation, error: checkError } = await supabase
        .from('group_participants')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (checkError) {
        const appError = ErrorHandler.handleSupabaseError(checkError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      if (existingParticipation) {
        toast({
          title: 'Déjà membre',
          description: 'Vous êtes déjà membre de ce groupe',
          variant: 'destructive'
        });
        return false;
      }

      // CRITIQUE: Validation et sanitisation des coordonnées avant insertion
      const { CoordinateValidator } = await import('@/utils/coordinateValidation');
      const validation = CoordinateValidator.validateCoordinates(userLocation.latitude, userLocation.longitude);
      
      if (!validation.isValid || !validation.sanitized) {
        console.error('❌ Coordonnées invalides pour insertion participant');
        toast({
          title: 'Coordonnées invalides',
          description: 'Les coordonnées de géolocalisation sont invalides.',
          variant: 'destructive'
        });
        return false;
      }

      console.log('🔧 Coordonnées sanitisées pour insertion BDD:', validation.sanitized);

      // Insertion du participant avec coordonnées sanitisées
      const participantData = {
        group_id: groupId,
        user_id: userId,
        status: 'confirmed' as const,
        last_seen: new Date().toISOString(),
        latitude: validation.sanitized.latitude,
        longitude: validation.sanitized.longitude,
        location_name: userLocation.locationName
      };

      const { error: joinError } = await supabase
        .from('group_participants')
        .insert(participantData);

      if (joinError) {
        console.error('❌ Erreur adhésion:', joinError);
        if (joinError.message.includes('User is already in an active group')) {
          toast({
            title: 'Participation limitée',
            description: 'Vous ne pouvez être que dans un seul groupe actif à la fois.',
            variant: 'destructive'
          });
        } else {
          const appError = ErrorHandler.handleSupabaseError(joinError);
          ErrorHandler.showErrorToast(appError);
        }
        return false;
      }

      console.log('✅ Participation ajoutée avec succès');

      // Vérification post-adhésion pour attribution automatique de bar
      setTimeout(async () => {
        const { data: updatedGroup } = await supabase
          .from('groups')
          .select('current_participants, status, bar_name')
          .eq('id', groupId)
          .single();

        if (updatedGroup && updatedGroup.current_participants === 5 && 
            updatedGroup.status === 'confirmed' && !updatedGroup.bar_name) {
          console.log('🤖 Groupe complet détecté, attribution de bar...');
          await AutomaticBarAssignmentService.assignBarToGroup(groupId);
        }
      }, 2000);

      toast({
        title: '✅ Groupe rejoint',
        description: 'Vous avez rejoint le groupe avec succès !',
      });
      
      return true;
    } catch (error) {
      ErrorHandler.logError('JOIN_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    }
  }

  static async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      console.log('🚪 Quitter le groupe:', groupId);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Vous devez être connecté.',
          variant: 'destructive'
        });
        return false;
      }

      const { error: deleteError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Erreur quitter groupe:', deleteError);
        const appError = ErrorHandler.handleSupabaseError(deleteError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      console.log('✅ Groupe quitté avec succès');
      
      toast({
        title: '👋 Groupe quitté',
        description: 'Vous avez quitté le groupe.',
      });
      
      return true;
    } catch (error) {
      ErrorHandler.logError('LEAVE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
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
        ErrorHandler.logError('UPDATE_USER_ACTIVITY', error);
      }
    } catch (error) {
      ErrorHandler.logError('UPDATE_USER_ACTIVITY', error);
    }
  }
}