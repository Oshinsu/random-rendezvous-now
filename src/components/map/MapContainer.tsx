
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapContainerProps } from './types';

const MapContainer = ({
  barName,
  barAddress,
  isGroupComplete,
  barLatitude,
  barLongitude,
  onMapLoaded,
  onBarLocationUpdated
}: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [barLocationUpdated, setBarLocationUpdated] = useState(false);
  const lastCoordinatesRef = useRef<{ lat?: number; lng?: number }>({});

  // Coordonnées par défaut pour Paris si les coordonnées du bar ne sont pas disponibles
  const defaultLat = 48.8566;
  const defaultLng = 2.3522;
  const mapLat = barLatitude || defaultLat;
  const mapLng = barLongitude || defaultLng;

  console.log('🗺️ [MapContainer] Props reçues:', {
    barName,
    barAddress,
    isGroupComplete,
    coordinates: barLatitude && barLongitude ? `${barLatitude}, ${barLongitude}` : 'Coordonnées par défaut utilisées'
  });

  // Effet pour détecter les changements de coordonnées du bar SEULEMENT si elles ont vraiment changé
  useEffect(() => {
    const hasValidCoordinates = barLatitude && barLongitude;
    const lastCoords = lastCoordinatesRef.current;
    
    // Vérifier si les coordonnées ont vraiment changé
    const coordinatesChanged = hasValidCoordinates && 
      (lastCoords.lat !== barLatitude || lastCoords.lng !== barLongitude);

    if (coordinatesChanged && mapInstanceRef.current) {
      console.log('🎯 [MapContainer] Nouvelles coordonnées du bar détectées, animation en cours...');
      
      const newPosition = { lat: barLatitude, lng: barLongitude };
      
      // Mettre à jour la référence des coordonnées
      lastCoordinatesRef.current = { lat: barLatitude, lng: barLongitude };
      
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
      
      // Marquer comme mis à jour une seule fois
      if (!barLocationUpdated) {
        setBarLocationUpdated(true);
        onBarLocationUpdated(true);
        
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
        
        // Retirer la notification après quelques secondes
        setTimeout(() => {
          setBarLocationUpdated(false);
          onBarLocationUpdated(false);
        }, 5000);
      }
    }
  }, [barLatitude, barLongitude, barLocationUpdated, onBarLocationUpdated]);

  useEffect(() => {
    if (!isGroupComplete || !mapRef.current) {
      console.log('🗺️ [MapContainer] Conditions non remplies:', { isGroupComplete, mapRef: !!mapRef.current });
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

        // Initialiser la référence des coordonnées
        if (barLatitude && barLongitude) {
          lastCoordinatesRef.current = { lat: barLatitude, lng: barLongitude };
        }

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

        onMapLoaded(true);
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
  }, [isGroupComplete, mapLat, mapLng, barName, barAddress, barLatitude, barLongitude, onMapLoaded]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-64 transition-all duration-300"
      style={{ minHeight: '256px' }}
    />
  );
};

export default MapContainer;
