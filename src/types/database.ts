
export interface Group {
  id: string;
  created_at: string;
  status: 'waiting' | 'full' | 'confirmed' | 'completed' | 'cancelled';
  bar_name?: string;
  bar_address?: string;
  meeting_time?: string;
  max_participants: number;
  current_participants: number;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  search_radius?: number;
  bar_latitude?: number;
  bar_longitude?: number;
  bar_place_id?: string;
}

export interface GroupParticipant {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  latitude?: number;
  longitude?: number;
  location_name?: string;
  last_seen?: string; // Nouveau champ pour tracker l'activité
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserOutingHistory {
  id: string;
  user_id: string;
  group_id: string;
  bar_name: string;
  bar_address: string;
  meeting_time: string;
  completed_at: string;
  participants_count: number;
  bar_latitude?: number;
  bar_longitude?: number;
  created_at: string;
}
