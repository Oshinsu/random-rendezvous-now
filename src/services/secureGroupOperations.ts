
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/types/database';
import { LocationData } from '@/services/geolocation';
import { ErrorHandler } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';

export class SecureGroupOperationsService {
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

  static async createSecureGroup(userLocation: LocationData, userId: string): Promise<Group | null> {
    try {
      console.log('🔐 Création sécurisée d\'un nouveau groupe');
      
      const groupData = {
        status: 'waiting' as const,
        max_participants: 5,
        current_participants: 0,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        location_name: userLocation.locationName,
        search_radius: 10000
      };

      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (createError) {
        const appError = ErrorHandler.handleSupabaseError(createError);
        ErrorHandler.showErrorToast(appError);
        return null;
      }

      // Ajouter l'utilisateur au groupe de manière sécurisée
      const participantData = {
        group_id: newGroup.id,
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
        // Nettoyer le groupe créé en cas d'échec
        await supabase.from('groups').delete().eq('id', newGroup.id);
        
        const appError = ErrorHandler.handleSupabaseError(joinError);
        ErrorHandler.showErrorToast(appError);
        return null;
      }

      console.log('✅ Groupe créé et utilisateur ajouté avec succès');
      return newGroup;
    } catch (error) {
      ErrorHandler.logError('CREATE_SECURE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return null;
    }
  }

  static async joinSecureGroup(groupId: string, userId: string, userLocation: LocationData): Promise<boolean> {
    try {
      console.log('🔐 Adhésion sécurisée au groupe:', groupId);
      
      // Vérifier d'abord que l'utilisateur n'est pas déjà dans le groupe
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
        const appError = ErrorHandler.handleSupabaseError(joinError);
        ErrorHandler.showErrorToast(appError);
        return false;
      }

      console.log('✅ Adhésion sécurisée réussie');
      return true;
    } catch (error) {
      ErrorHandler.logError('JOIN_SECURE_GROUP', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      ErrorHandler.showErrorToast(appError);
      return false;
    }
  }

  static async leaveSecureGroup(groupId: string, userId: string): Promise<boolean> {
    try {
      console.log('🔐 Quitter le groupe de manière sécurisée:', groupId);
      
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

      console.log('✅ Groupe quitté avec succès');
      return true;
    } catch (error) {
      ErrorHandler.logError('LEAVE_SECURE_GROUP', error);
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
