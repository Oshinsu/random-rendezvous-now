
import React from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { MapNotificationsProps } from './types';

const MapNotifications = ({ barLocationUpdated, hasExactLocation }: MapNotificationsProps) => {
  return (
    <>
      {/* Notification de mise à jour si bar assigné récemment */}
      {barLocationUpdated && hasExactLocation && (
        <div className="bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-300 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-800">
            <MapPin className="h-4 w-4 animate-bounce" />
            <span className="text-sm font-semibold">🎉 Destination trouvée !</span>
          </div>
          <p className="text-emerald-700 text-xs mt-1">
            Votre bar a été sélectionné automatiquement. Consultez la carte ci-dessous !
          </p>
        </div>
      )}

      {/* Avertissement si position approximative */}
      {!hasExactLocation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Position en cours d'attribution</span>
          </div>
          <p className="text-amber-700 text-xs mt-1">
            Le bar et les coordonnées exactes sont en cours de recherche...
          </p>
        </div>
      )}
    </>
  );
};

export default MapNotifications;
