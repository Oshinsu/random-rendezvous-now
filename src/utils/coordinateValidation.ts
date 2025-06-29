
// Secure GPS coordinate validation utilities

interface CoordinateValidationResult {
  isValid: boolean;
  sanitized?: {
    latitude: number;
    longitude: number;
  };
  error?: string;
}

export class CoordinateValidator {
  // Validate and sanitize GPS coordinates
  static validateCoordinates(lat: any, lng: any): CoordinateValidationResult {
    // Type checking
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return {
        isValid: false,
        error: 'Coordinates must be numbers'
      };
    }

    // NaN checking
    if (isNaN(lat) || isNaN(lng)) {
      return {
        isValid: false,
        error: 'Coordinates cannot be NaN'
      };
    }

    // Finite checking (prevents Infinity values)
    if (!isFinite(lat) || !isFinite(lng)) {
      return {
        isValid: false,
        error: 'Coordinates must be finite numbers'
      };
    }

    // Range validation
    if (lat < -90 || lat > 90) {
      return {
        isValid: false,
        error: 'Latitude must be between -90 and 90 degrees'
      };
    }

    if (lng < -180 || lng > 180) {
      return {
        isValid: false,
        error: 'Longitude must be between -180 and 180 degrees'
      };
    }

    // Precision sanitization (automatically round to 6 decimal places instead of rejecting)
    const maxPrecision = 6; // ~11cm accuracy
    const sanitizedLat = parseFloat(lat.toFixed(maxPrecision));
    const sanitizedLng = parseFloat(lng.toFixed(maxPrecision));

    console.log('🔧 [COORDINATE VALIDATION] Coordinates validated and sanitized:', {
      original: { lat, lng },
      sanitized: { lat: sanitizedLat, lng: sanitizedLng }
    });

    // Return sanitized coordinates (always valid now)
    return {
      isValid: true,
      sanitized: {
        latitude: sanitizedLat,
        longitude: sanitizedLng
      }
    };
  }

  // Helper method to count decimal places (kept for potential future use)
  private static getDecimalPlaces(num: number): number {
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
  }

  // Validate coordinate objects
  static validateLocationData(location: any): CoordinateValidationResult {
    if (!location || typeof location !== 'object') {
      return {
        isValid: false,
        error: 'Location data must be an object'
      };
    }

    return this.validateCoordinates(location.latitude, location.longitude);
  }

  // Validate arrays of coordinates
  static validateCoordinateArray(coordinates: any[]): CoordinateValidationResult {
    if (!Array.isArray(coordinates)) {
      return {
        isValid: false,
        error: 'Coordinates must be an array'
      };
    }

    if (coordinates.length !== 2) {
      return {
        isValid: false,
        error: 'Coordinates array must contain exactly 2 elements [lat, lng]'
      };
    }

    return this.validateCoordinates(coordinates[0], coordinates[1]);
  }
}
