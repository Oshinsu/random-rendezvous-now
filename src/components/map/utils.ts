
export const formatMeetingTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getTimeUntilMeeting = (timeString: string) => {
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

export const openInGoogleMaps = (barLatitude?: number, barLongitude?: number, barName?: string, barAddress?: string) => {
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
