
export interface Group {
  id: string;
  created_at: string;
  status: 'waiting' | 'full' | 'confirmed' | 'completed' | 'cancelled';
  bar_name?: string;
  bar_address?: string;
  meeting_time?: string;
  max_participants: number;
  current_participants: number;
}

export interface GroupParticipant {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}
