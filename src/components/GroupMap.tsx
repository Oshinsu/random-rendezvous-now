
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';
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
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [barLocationUpdated, setBarLocationUpdated] = useState(false);

  // Coordonnées par défaut pour Paris si les coordonnées du bar ne sont pas disponibles
  const defaultLat = 48.8566;
  const defaultLng = 2.3522;
  const mapLat = barLatitude || defaultLat;
  const mapLng = barLongitude || defaultLng;

  console.log('🗺️ [GroupMap] Props reçues:', {
    barName,
    barAddress,
    meetingTime,
    isGroupComplete,
    coordinates: barLatitude && barLongitude ? `${barLatitude}, ${barLongitude}` : 'Coordonnées par défaut utilisées'
  });

  // Effet pour détecter les changements de coordonnées du bar
  useEffect(() => {
    if (barLatitude && barLongitude && mapInstanceRef.current && mapLoaded) {
      console.log('🎯 [GroupMap] Nouvelles coordonnées du bar détectées, animation en cours...');
      
      const newPosition = { lat: barLatitude, lng: barLongitude };
      
      // Animation de zoom et de centrage sur le nouveau bar
      mapInstanceRef.current.panTo(newPosition);
      
      // Zoom progressif avec animation
      setTimeout(() => {
        mapInstanceRef.current.setZoom(17);
      }, 500);
      
      // Mettre à jour le marqueur
      if (markerRef.current) {
        markerRef.current.setPosition(newPosition);
        
        // Animation du marqueur (petit bounce) - avec vérification de l'existence de l'API
        if (window.google?.maps?.Animation) {
          markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            if (markerRef.current) {
              markerRef.current.setAnimation(null);
            }
          }, 2000);
        }
      }
      
      setBarLocationUpdated(true);
      
      // Animation de vibration de la carte pour attirer l'attention
      if (mapRef.current) {
        mapRef.current.style.transform = 'scale(1.02)';
        mapRef.current.style.transition = 'transform 0.3s ease-in-out';
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.style.transform = 'scale(1)';
          }
        }, 300);
      }
    }
  }, [barLatitude, barLongitude, mapLoaded]);

  useEffect(() => {
    if (!isGroupComplete || !mapRef.current) {
      console.log('🗺️ [GroupMap] Conditions non remplies:', { isGroupComplete, mapRef: !!mapRef.current });
      return;
    }

    const initMap = async () => {
      try {
        console.log('🗺️ Initialisation de Google Maps avec coordonnées:', { lat: mapLat, lng: mapLng });
        
        const loader = new Loader({
          apiKey: 'AIzaSyCySpM4EZYtGpOY6dhANdZ1ZzVfArTexBw',
          version: 'weekly',
          libraries: ['places', 'marker']
        });

        const google = await loader.load();
        
        const mapOptions: any = {
          center: { lat: mapLat, lng: mapLng },
          zoom: barLatitude && barLongitude ? 16 : 12, // Zoom moins fort si coordonnées par défaut
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels.text',
              stylers: [{ visibility: 'off' }]
            }
          ],
          // Amélioration des animations
          gestureHandling: 'cooperative',
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true
        };

        const map = new google.maps.Map(mapRef.current!, mapOptions);
        mapInstanceRef.current = map;

        // Ajouter un marqueur pour le bar (ou position par défaut)
        const marker = new google.maps.Marker({
          position: { lat: mapLat, lng: mapLng },
          map: map,
          title: barName,
          animation: barLatitude && barLongitude && google.maps.Animation ? google.maps.Animation.DROP : null,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path fill="${barLatitude && barLongitude ? '#059669' : '#f59e0b'}" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
                <circle fill="white" cx="16" cy="16" r="8"/>
                <text x="16" y="20" text-anchor="middle" fill="${barLatitude && barLongitude ? '#059669' : '#f59e0b'}" font-size="12" font-weight="bold">${barLatitude && barLongitude ? '🍺' : '📍'}</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40)
          }
        });

        markerRef.current = marker;

        // Ajouter une infobulle
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: system-ui;">
              <h3 style="margin: 0 0 4px 0; color: ${barLatitude && barLongitude ? '#059669' : '#f59e0b'}; font-weight: bold;">${barName}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">${barAddress}</p>
              <p style="margin: 4px 0 0 0; color: ${barLatitude && barLongitude ? '#059669' : '#f59e0b'}; font-size: 12px; font-weight: 500;">
                ${barLatitude && barLongitude ? '📍 Votre destination' : '📍 Zone approximative'}
              </p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Ouvrir l'infobulle par défaut seulement si on a des coordonnées précises
        if (barLatitude && barLongitude) {
          infoWindow.open(map, marker);
        }

        setMapLoaded(true);
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
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [isGroupComplete, mapLat, mapLng, barName, barAddress]);

  if (!isGroupComplete) {
    console.log('🗺️ [GroupMap] Groupe non complet, ne pas afficher la carte');
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
    } else {
      // Recherche par nom et adresse si pas de coordonnées
      const query = encodeURIComponent(`${barName} ${barAddress}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank');
    }
  };

  // Vérifier si on a des coordonnées précises ou si on utilise les coordonnées par défaut
  const hasExactLocation = barLatitude && barLongitude;

  return (
    <Card className={`w-full transition-all duration-500 ${hasExactLocation ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'} ${barLocationUpdated ? 'animate-pulse' : ''}`}>
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

        {/* Informations du bar */}
        <div className={`bg-white rounded-xl p-6 shadow-sm border transition-all duration-300 ${hasExactLocation ? 'border-emerald-200' : 'border-amber-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${hasExactLocation ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${hasExactLocation ? 'text-emerald-900' : 'text-amber-900'}`}>
                {barName}
              </h3>
              <p className={`mb-3 transition-colors duration-300 ${hasExactLocation ? 'text-emerald-700' : 'text-amber-700'}`}>
                {barAddress}
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`transition-all duration-300 cursor-pointer hover:scale-105 ${hasExactLocation ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-200 transition-all duration-300 hover:shadow-md">
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

        {/* Carte Google Maps avec animation */}
        <div className={`bg-white rounded-xl overflow-hidden shadow-sm border border-emerald-200 transition-all duration-500 ${mapLoaded ? 'opacity-100' : 'opacity-50'}`}>
          <div 
            ref={mapRef} 
            className="w-full h-64 transition-all duration-300"
            style={{ minHeight: '256px' }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMap;
