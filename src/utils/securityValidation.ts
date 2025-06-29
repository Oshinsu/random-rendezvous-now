
import { CoordinateValidator } from './coordinateValidation';

// Utilitaires de validation côté client pour compléter la sécurité serveur

export class SecurityValidation {
  // Validation des messages côté client (complément du trigger serveur)
  static validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: 'Le message ne peut pas être vide.' };
    }

    if (message.trim().length > 500) {
      return { isValid: false, error: 'Le message est trop long (maximum 500 caractères).' };
    }

    // Vérifications de sécurité basiques côté client
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(message)) {
        return { isValid: false, error: 'Le message contient du contenu non autorisé.' };
      }
    }

    return { isValid: true };
  }

  // Validation des coordonnées géographiques côté client (utilise le nouveau validateur)
  static validateCoordinates(latitude: number, longitude: number): boolean {
    const result = CoordinateValidator.validateCoordinates(latitude, longitude);
    return result.isValid;
  }

  // Validation sécurisée des coordonnées avec détails
  static validateCoordinatesSecure(latitude: any, longitude: any): { isValid: boolean; error?: string; sanitized?: { latitude: number; longitude: number } } {
    const result = CoordinateValidator.validateCoordinates(latitude, longitude);
    
    if (!result.isValid) {
      console.warn('🚨 Coordinate validation failed:', result.error);
    }
    
    return {
      isValid: result.isValid,
      error: result.error,
      sanitized: result.sanitized
    };
  }

  // Validation des données de groupe côté client
  static validateGroupData(groupData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!groupData.max_participants || groupData.max_participants < 1 || groupData.max_participants > 5) {
      errors.push('Le nombre maximum de participants doit être entre 1 et 5.');
    }

    if (groupData.current_participants < 0 || groupData.current_participants > groupData.max_participants) {
      errors.push('Le nombre actuel de participants est invalide.');
    }

    if (groupData.latitude !== undefined && groupData.longitude !== undefined) {
      const coordValidation = this.validateCoordinatesSecure(groupData.latitude, groupData.longitude);
      if (!coordValidation.isValid) {
        errors.push(`Coordonnées invalides: ${coordValidation.error}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Nettoyage sécurisé des données utilisateur côté client
  static sanitizeUserInput(input: string): string {
    if (!input) return '';

    return input
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validation des noms de profil
  static validateProfileName(name: string): { isValid: boolean; error?: string } {
    if (!name) {
      return { isValid: true }; // Les noms sont optionnels
    }

    if (name.length > 50) {
      return { isValid: false, error: 'Le nom ne peut pas dépasser 50 caractères.' };
    }

    // Vérifier les caractères autorisés (lettres, espaces, tirets, apostrophes)
    const namePattern = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    if (!namePattern.test(name)) {
      return { isValid: false, error: 'Le nom contient des caractères non autorisés.' };
    }

    return { isValid: true };
  }

  // Validation des évaluations de bars
  static validateRating(rating: number): boolean {
    return typeof rating === 'number' && rating >= 1 && rating <= 5 && Number.isInteger(rating);
  }

  // Validation des commentaires d'évaluation
  static validateReview(review: string): { isValid: boolean; error?: string } {
    if (!review) {
      return { isValid: true }; // Les commentaires sont optionnels
    }

    if (review.length > 1000) {
      return { isValid: false, error: 'Le commentaire ne peut pas dépasser 1000 caractères.' };
    }

    return { isValid: true };
  }
}
