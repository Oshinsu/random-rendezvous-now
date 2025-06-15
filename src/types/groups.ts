
import { LocationData } from '@/services/geolocation';

export interface GroupMember {
  id: string;
  name: string;
  isConnected: boolean;
  joinedAt: string;
  status: 'confirmed' | 'pending';
  lastSeen?: string;
}

export interface ParisBar {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const PARIS_BARS: ParisBar[] = [
  { name: "Le Procope", address: "13 Rue de l'Ancienne Comédie, 75006 Paris", lat: 48.8534, lng: 2.3371 },
  { name: "Harry's Bar", address: "5 Rue Daunou, 75002 Paris", lat: 48.8699, lng: 2.3314 },
  { name: "Le Mary Celeste", address: "1 Rue Commines, 75003 Paris", lat: 48.8596, lng: 2.3639 },
  { name: "Candelaria", address: "52 Rue de Saintonge, 75003 Paris", lat: 48.8625, lng: 2.3639 },
  { name: "Little Red Door", address: "60 Rue Charlot, 75003 Paris", lat: 48.8630, lng: 2.3652 },
  { name: "Le Syndicat", address: "51 Rue du Faubourg Saint-Antoine, 75011 Paris", lat: 48.8532, lng: 2.3724 },
  { name: "Hemingway Bar", address: "15 Place Vendôme, 75001 Paris", lat: 48.8670, lng: 2.3292 },
  { name: "Le Bar du Plaza", address: "25 Avenue Montaigne, 75008 Paris", lat: 48.8665, lng: 2.3065 },
  { name: "Moonshiner", address: "5 Rue Sedaine, 75011 Paris", lat: 48.8553, lng: 2.3714 },
  { name: "Glass", address: "7 Rue Frochot, 75009 Paris", lat: 48.8823, lng: 2.3367 }
];
