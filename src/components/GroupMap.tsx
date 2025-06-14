
import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GroupMapProps {
  barName: string;
  barAddress: string;
  meetingTime: string;
  isGroupComplete: boolean;
  barLatitude?: number;
  barLongitude?: number;
}

const GroupMap = ({ 
  barName, 
  barAddress, 
  meetingTime, 
  isGroupComplete,
  barLatitude,
  barLongitude
}: GroupMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isGroupComplete || !barLatitude || !barLongitude || !mapRef.current) {
      return;
    }

    const initMap = async () => {
      try {
        console.log('🗺️ Initialisation de Google Maps...');
        
        const loader = new Loader({
          apiKey: 'AIzaSyCySpM4EZYtGpOY6dhANdZ1ZzVfArTexBw',
          version: 'weekly',
          libraries: ['places', 'marker']
        });

        const google = await loader.load();
        
        const mapOptions: any = {
          center: { lat: barLatitude, lng: barLongitude },
          zoom: 16,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels.text',
              stylers: [{ visibility: 'off' }]
            }
          ]
        };

        const map = new google.maps.Map(mapRef.current!, mapOptions);
        mapInstanceRef.current = map;

        // Ajouter un marqueur pour le bar
        const marker = new google.maps.Marker({
          position: { lat: barLatitude, lng: barLongitude },
          map: map,
          title: barName,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path fill="#059669" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
                <circle fill="white" cx="16" cy="16" r="8"/>
                <text x="16" y="20" text-anchor="middle" fill="#059669" font-size="12" font-weight="bold">🍺</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40)
          }
        });

        // Ajouter une infobulle
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: system-ui;">
              <h3 style="margin: 0 0 4px 0; color: #059669; font-weight: bold;">${barName}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">${barAddress}</p>
              <p style="margin: 4px 0 0 0; color: #059669; font-size: 12px; font-weight: 500;">📍 Votre destination</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Ouvrir l'infobulle par défaut
        infoWindow.open(map, marker);

        console.log('✅ Carte Google Maps initialisée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de Google Maps:', error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        // Nettoyer la carte si nécessaire
        mapInstanceRef.current = null;
      }
    };
  }, [isGroupComplete, barLatitude, barLongitude, barName, barAddress]);

  if (!isGroupComplete) {
    return null;
  }

  const formatMeetingTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilMeeting = (timeString: string) => {
    const meetingDate = new Date(timeString);
    const now = new Date();
    const diffMs = meetingDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) {
      return "C'est l'heure !";
    } else if (diffMins < 60) {
      return `Dans ${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `Dans ${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
  };

  const openInGoogleMaps = () => {
    if (barLatitude && barLongitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${barLatitude},${barLongitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="w-full bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <MapPin className="h-5 w-5" />
          Votre destination
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations du bar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-emerald-900 mb-2">{barName}</h3>
              <p className="text-emerald-700 mb-3">{barAddress}</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="bg-emerald-100 text-emerald-800 cursor-pointer hover:bg-emerald-200"
                  onClick={openInGoogleMaps}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Voir l'itinéraire
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Horaire de rendez-vous */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Rendez-vous</h4>
              <p className="text-blue-700 font-medium capitalize mb-2">
                {formatMeetingTime(meetingTime)}
              </p>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                {getTimeUntilMeeting(meetingTime)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Carte Google Maps */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-emerald-200">
          <div 
            ref={mapRef} 
            className="w-full h-64"
            style={{ minHeight: '256px' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMap;
