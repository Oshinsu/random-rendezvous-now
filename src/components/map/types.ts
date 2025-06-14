
export interface GroupMapProps {
  barName: string;
  barAddress: string;
  meetingTime: string;
  isGroupComplete: boolean;
  barLatitude?: number;
  barLongitude?: number;
}

export interface MapContainerProps {
  barName: string;
  barAddress: string;
  isGroupComplete: boolean;
  barLatitude?: number;
  barLongitude?: number;
  onMapLoaded: (loaded: boolean) => void;
  onBarLocationUpdated: (updated: boolean) => void;
}

export interface BarInfoCardProps {
  barName: string;
  barAddress: string;
  hasExactLocation: boolean;
  onOpenInGoogleMaps: () => void;
}

export interface MeetingTimeCardProps {
  meetingTime: string;
}

export interface MapNotificationsProps {
  barLocationUpdated: boolean;
  hasExactLocation: boolean;
}
