
import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarInfoCardProps } from './types';

const BarInfoCard = ({ barName, barAddress, hasExactLocation, onOpenInGoogleMaps }: BarInfoCardProps) => {
  const handleOpenInGoogleMaps = () => {
    onOpenInGoogleMaps();
  };

  return (
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
              onClick={handleOpenInGoogleMaps}
            >
              <Navigation className="h-3 w-3 mr-1" />
              Voir l'itinéraire
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarInfoCard;
