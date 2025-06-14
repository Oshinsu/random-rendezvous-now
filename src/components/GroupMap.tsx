
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GroupMapProps {
  barName: string;
  barAddress: string;
  meetingTime: string;
  isGroupComplete: boolean;
}

const GroupMap = ({ barName, barAddress, meetingTime, isGroupComplete }: GroupMapProps) => {
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
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
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

        {/* Carte placeholder */}
        <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center border border-gray-200">
          <div className="text-center text-gray-600">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Carte interactive à venir</p>
            <p className="text-xs text-gray-500 mt-1">
              En attendant, utilisez votre app de navigation préférée
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupMap;
