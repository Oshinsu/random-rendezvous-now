import { supabase } from '@/integrations/supabase/client';
import { GeolocationService, LocationData } from './geolocation';
import { ErrorHandler } from '@/utils/errorHandling';
import { SystemMessagingService } from './systemMessaging';
import { AutomaticBarAssignmentService } from './automaticBarAssignment';
import { toast } from '@/hooks/use-toast';
import type { Group, GroupParticipant } from '@/types/database';
import type { GroupMember } from '@/types/groups';

export class UnifiedGroupService {
  static isUserConnected(lastSeen: string): boolean {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
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
        ErrorHandler.logError('UPDATE_LAST_SEEN', error);
      } else {
        console.log('✅ Last_seen mis à jour pour le groupe:', groupId);
      }
    } catch (error) {
      ErrorHandler.logError('UPDATE_USER_LAST_SEEN', error);
    }
  }

  // CORRIGÉ: Nettoyage SÉCURISÉ avec délais augmentés
  static async forceCleanupOldGroups(): Promise<void> {
    try {
      console.log('🧹 NETTOYAGE SÉCURISÉ avec délais augmentés...');
      
      // 1. Supprimer SEULEMENT les participants vraiment inactifs (12 heures au lieu de 6)
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      
      const { error: cleanupParticipantsError } = await supabase
        .from('group_participants')
        .delete()
        .lt('last_seen', twelveHoursAgo);

      if (cleanupParticipantsError) {
        console.error('❌ Erreur nettoyage participants:', cleanupParticipantsError);
      } else {
        console.log('✅ Participants inactifs depuis 12h supprimés');
      }

      // 2. Supprimer SEULEMENT les groupes en attente AVEC DÉLAI AUGMENTÉ (10 minutes + vides)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { error: cleanupWaitingError } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'waiting')
        .eq('current_participants', 0) // SEULEMENT les groupes vides
        .lt('created_at', tenMinutesAgo); // Délai augmenté à 10 minutes

      if (cleanupWaitingError) {
        console.error('❌ Erreur nettoyage groupes en attente:', cleanupWaitingError);
      } else {
        console.log('✅ Groupes en attente vides et anciens (10min+) supprimés');
      }

      // 3. Supprimer les groupes confirmés sans bar (situation impossible mais nettoyage de sécurité)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { error: cleanupConfirmedError } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'confirmed')
        .is('bar_name', null)
        .lt('created_at', oneHourAgo); // Seulement si anciens

      if (cleanupConfirmedError) {
        console.error('❌ Erreur nettoyage groupes confirmés sans bar:', cleanupConfirmedError);
      } else {
        console.log('✅ Groupes confirmés sans bar anciens supprimés');
      }

      // 4. Supprimer les groupes terminés (meeting_time + 3h)
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      
      const { error: cleanupCompletedError } = await supabase
        .from('groups')
        .delete()
        .eq('status', 'confirmed')
        .not('meeting_time', 'is', null)
        .lt('meeting_time', threeHoursAgo);

      if (cleanupCompletedError) {
        console.error('❌ Erreur nettoyage groupes terminés:', cleanupCompletedError);
      } else {
        console.log('✅ Groupes terminés supprimés');
      }

      console.log('✅ NETTOYAGE SÉCURISÉ terminé avec délais augmentés');
    } catch (error) {
      ErrorHandler.logError('FORCE_CLEANUP_OLD_GROUPS', error);
      console.error('❌ Erreur dans le nettoyage sécurisé:', error);
    }
  }

  // CORRIGÉ: Recherche de participations SANS nettoyage automatique
  static async getUserParticipations(userId: string): Promise<any[]> {
    try {
      console.log('📋 Recherche des participations actives pour:', userId);
      
      const { data, error } = await supabase
        .from('group_participants')
        .select(`
          id,
          group_id,
          joined_at,
          status,
          last_seen,
          groups!inner(
            id,
            status,
            created_at,
            current_participants,
            max_participants,
            latitude,
            longitude,
            location_name,
            search_radius,
            bar_name,
            bar_address,
            meeting_time,
            bar_latitude,
            bar_longitude,
            bar_place_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .in('groups.status', ['waiting', 'confirmed'])
        .gt('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Actif dans les dernières 24h

      if (error) {
        ErrorHandler.logError('FETCH_USER_PARTICIPATIONS', error);
        const appError = ErrorHandler.handleSupabaseError(error);
        ErrorHandler.showErrorToast(appError);
        return [];
      }

      // Validation supplémentaire côté client MOINS STRICTE
      const validParticipations = (data || []).filter(participation => {
        const group = participation.groups;
        if (!group) return false;
        
        // Vérifier que le groupe n'est pas TRÈS ancien (7 jours au lieu de 24h)
        const groupAge = Date.now() - new Date(group.created_at).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours max
        
        if (groupAge > maxAge) {
          console.log('🗑️ Groupe très ancien filtré:', group.id);
          return false;
        }
        
        return true;
      });

      console.log('✅ Participations valides trouvées:', validParticipations.length);
      return validParticipations;
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

      const { data: currentGroup, error: groupError } = await supabase
        .from('groups')
        .select('current_participants, status, bar_name')
        .eq('id', groupId)
        .single();

      if (groupError) {
        ErrorHandler.logError('FETCH_GROUP_INFO', groupError);
      } else {
        console.log('📊 Comptage actuel en BDD:', currentGroup.current_participants, 'vs réel:', realParticipantCount);
        
        if (currentGroup.current_participants !== realParticipantCount) {
          console.log('🚨 INCOHÉRENCE DÉTECTÉE ! Correction forcée...');
          
          let newStatus = currentGroup.status;
          let updateData: any = {
            current_participants: realParticipantCount
          };

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
            console.log('⏳ Remise en waiting et suppression du bar');
          } else if (realParticipantCount === 5 && currentGroup.status === 'waiting') {
            // 🔥 ATTRIBUTION AUTOMATIQUE DE BAR !
            newStatus = 'confirmed';
            updateData = {
              ...updateData,
              status: 'confirmed'
            };
            console.log('🎉 Groupe complet ! Passage en confirmed et attribution automatique de bar');
          }

          const { error: correctionError } = await supabase
            .from('groups')
            .update(updateData)
            .eq('id', groupId);

          if (correctionError) {
            ErrorHandler.logError('GROUP_COUNT_CORRECTION', correctionError);
          } else {
            console.log('✅ Comptage corrigé avec succès:', realParticipantCount);
            
            // 🚀 DÉCLENCHEMENT AUTOMATIQUE DE L'ATTRIBUTION DE BAR
            if (realParticipantCount === 5 && newStatus === 'confirmed' && !currentGroup.bar_name) {
              console.log('🤖 Déclenchement attribution automatique de bar...');
              setTimeout(async () => {
                await AutomaticBarAssignmentService.assignBarToGroup(groupId);
              }, 1000); // Délai pour s'assurer que la mise à jour du statut est propagée
            }
          }
        }
      }

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

  // CORRIGÉ: Création de groupe avec FONCTION ATOMIQUE
  static async createGroup(userLocation: LocationData, userId: string): Promise<Group | null> {
    try {
      console.log('🔐 Création ATOMIQUE d\'un nouveau groupe avec fonction PostgreSQL sécurisée');
      
      // Vérifier d'abord si l'utilisateur peut créer un groupe (sécurité)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Vous devez être connecté pour créer un groupe.',
          variant: 'destructive'
        });
        return null;
      }

      // TRANSACTION ATOMIQUE: Utiliser la fonction PostgreSQL sécurisée
      const { data: result, error: transactionError } = await supabase.rpc('create_group_with_participant', {
        p_latitude: userLocation.latitude,
        p_longitude: userLocation.longitude,
        p_location_name: userLocation.locationName,
        p_user_id: userId
      });

      if (transactionError) {
        console.error('❌ Erreur transaction atomique:', transactionError);
        
        // Gestion spécifique des erreurs
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

  // CORRIGÉ: Rejoindre groupe avec VÉRIFICATION DE SÉCURITÉ
  static async joinGroup(groupId: string, userId: string, userLocation: LocationData): Promise<boolean> {
    try {
      console.log('🔐 Adhésion au groupe avec vérification de sécurité:', groupId);
      
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Vous devez être connecté pour rejoindre un groupe.',
          variant: 'destructive'
        });
        return false;
      }

      // VÉRIFICATION DE SÉCURITÉ: S'assurer que le groupe existe avant d'essayer de le rejoindre
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

      // Données participant conformes aux contraintes de validation
      const participantData = {
        group_id: groupId,
        user_id: userId,
        status: 'confirmed' as const,
        last_seen: new Date().toISOString(),
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
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
        } else if (joinError.message.includes('Invalid coordinates')) {
          toast({
            title: 'Coordonnées invalides',
            description: 'Les coordonnées de géolocalisation sont invalides.',
            variant: 'destructive'
          });
        } else {
          const appError = ErrorHandler.handleSupabaseError(joinError);
          ErrorHandler.showErrorToast(appError);
        }
        return false;
      }

      console.log('✅ Adhésion réussie avec vérification sécurisée');
      
      // Vérification post-ajout pour attribution automatique et notification
      setTimeout(async () => {
        console.log('🔍 Vérification attribution automatique après ajout...');
        const { data: updatedGroup } = await supabase
          .from('groups')
          .select('current_participants, status, bar_name, max_participants')
          .eq('id', groupId)
          .single();
          
        if (updatedGroup && updatedGroup.current_participants === updatedGroup.max_participants) {
          // Show celebratory notification when group becomes full
          toast({
            title: '🎉 Groupe complet !',
            description: `Félicitations ! Votre groupe de ${updatedGroup.max_participants} personnes est maintenant complet. Un bar va être assigné automatiquement !`,
            duration: 5000,
          });
          
          if (updatedGroup.status === 'confirmed' && !updatedGroup.bar_name) {
            console.log('🤖 Déclenchement attribution automatique après ajout participant...');
            await AutomaticBarAssignmentService.assignBarToGroup(groupId);
          }
        }
      }, 2000);
      
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
      console.log('🔐 Quitter le groupe avec validation de sécurité:', groupId);
      
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: 'Erreur d\'authentification',
          description: 'Vous devez être connecté pour quitter un groupe.',
          variant: 'destructive'
        });
        return false;
      }

      const { error: leaveError } = await supabase
        .from('group_participants')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (leaveError) {
        const appError = ErrorHandler.handleSupabaseError(leaveError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      console.log('✅ Groupe quitté avec succès (validation sécurisée)');
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
