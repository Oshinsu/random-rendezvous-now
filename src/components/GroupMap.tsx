
import React, { useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GroupMapProps } from './map/types';
import MapNotifications from './map/MapNotifications';
import BarInfoCard from './map/BarInfoCard';
import MeetingTimeCard from './map/MeetingTimeCard';
import MapContainer from './map/MapContainer';
import { openInGoogleMaps } from './map/utils';

const GroupMap = ({ 
  barName, 
  barAddress, 
  meetingTime, 
  isGroupComplete,
  barLatitude,
  barLongitude
}: GroupMapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [barLocationUpdated, setBarLocationUpdated] = useState(false);

  console.log('🗺️ [GroupMap] Props reçues:', {
    barName,
    barAddress,
    meetingTime,
    isGroupComplete,
    coordinates: barLatitude && barLongitude ? `${barLatitude}, ${barLongitude}` : 'Coordonnées par défaut utilisées'
  });

  if (!isGroupComplete) {
    console.log('🗺️ [GroupMap] Groupe non complet, ne pas afficher la carte');
    return null;
  }

  // Vérifier si on a des coordonnées précises ou si on utilise les coordonnées par défaut
  const hasExactLocation = !!(barLatitude && barLongitude);

  const handleOpenInGoogleMaps = () => {
    openInGoogleMaps(barLatitude, barLongitude, barName, barAddress);
  };

  return (
    <Card className={`w-full transition-all duration-500 ${hasExactLocation ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 transition-colors duration-300 ${hasExactLocation ? 'text-emerald-800' : 'text-amber-800'}`}>
          <MapPin className={`h-5 w-5 ${barLocationUpdated ? 'animate-bounce' : ''}`} />
          Votre destination
          {!hasExactLocation && (
            <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <MapNotifications 
          barLocationUpdated={barLocationUpdated}
          hasExactLocation={hasExactLocation}
        />

        <BarInfoCard
          barName={barName}
          barAddress={barAddress}
          hasExactLocation={hasExactLocation}
          onOpenInGoogleMaps={handleOpenInGoogleMaps}
        />

        <MeetingTimeCard meetingTime={meetingTime} />

        {/* Carte Google Maps avec animation */}
        <div className={`bg-white rounded-xl overflow-hidden shadow-sm border border-emerald-200 transition-all duration-500 ${mapLoaded ? 'opacity-100' : 'opacity-50'}`}>
          <MapContainer
            barName={barName}
            barAddress={barAddress}
            isGroupComplete={isGroupComplete}
            barLatitude={barLatitude}
            barLongitude={barLongitude}
            onMapLoaded={setMapLoaded}
            onBarLocationUpdated={setBarLocationUpdated}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMap;
