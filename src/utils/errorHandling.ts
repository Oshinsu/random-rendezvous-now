
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export interface AppError {
  code: string;
  message: string;
  details?: string;
}

export class ErrorHandler {
  static handleSupabaseError(error: PostgrestError): AppError {
    console.error('❌ Supabase Error:', error);
    
    // Handle specific error codes
    switch (error.code) {
      case 'PGRST116':
        return {
          code: 'NO_DATA',
          message: 'Aucune donnée trouvée',
          details: error.message
        };
      case '42501':
        return {
          code: 'PERMISSION_DENIED',
          message: 'Accès refusé. Vérifiez vos permissions.',
          details: error.message
        };
      case '23503':
        return {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Opération impossible - données liées manquantes',
          details: error.message
        };
      case '23505':
        return {
          code: 'UNIQUE_VIOLATION',
          message: 'Cette action a déjà été effectuée',
          details: error.message
        };
      default:
        return {
          code: 'DATABASE_ERROR',
          message: 'Erreur de base de données',
          details: error.message
        };
    }
  }

  static handleGenericError(error: Error): AppError {
    console.error('❌ Generic Error:', error);
    
    if (error.message.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Problème de connexion réseau',
        details: error.message
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Une erreur inattendue s\'est produite',
      details: error.message
    };
  }

  static showErrorToast(error: AppError): void {
    toast({
      title: 'Erreur',
      description: error.message,
      variant: 'destructive'
    });
  }

  static logError(context: string, error: any): void {
    console.error(`❌ [${context}]`, {
      error,
      timestamp: new Date().toISOString(),
      context
    });
  }
}
