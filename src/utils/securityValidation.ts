
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

  // Validation des coordonnées géographiques côté client
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
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
      if (!this.validateCoordinates(groupData.latitude, groupData.longitude)) {
        errors.push('Les coordonnées géographiques sont invalides.');
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
