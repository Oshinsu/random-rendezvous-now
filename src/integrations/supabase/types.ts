export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bar_ratings: {
        Row: {
          average_rating: number
          bar_address: string
          bar_name: string
          bar_place_id: string
          created_at: string
          id: string
          sum_ratings: number
          total_ratings: number
          updated_at: string
        }
        Insert: {
          average_rating?: number
          bar_address: string
          bar_name: string
          bar_place_id: string
          created_at?: string
          id?: string
          sum_ratings?: number
          total_ratings?: number
          updated_at?: string
        }
        Update: {
          average_rating?: number
          bar_address?: string
          bar_name?: string
          bar_place_id?: string
          created_at?: string
          id?: string
          sum_ratings?: number
          total_ratings?: number
          updated_at?: string
        }
        Relationships: []
      }
      group_messages: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_system: boolean
          message: string
          reactions: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_system?: boolean
          message: string
          reactions?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_system?: boolean
          message?: string
          reactions?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_participants: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          last_seen: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          last_seen?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          last_seen?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          bar_address: string | null
          bar_latitude: number | null
          bar_longitude: number | null
          bar_name: string | null
          bar_place_id: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          current_participants: number
          id: string
          is_scheduled: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          max_participants: number
          meeting_time: string | null
          reminder_sent: boolean | null
          scheduled_for: string | null
          search_radius: number | null
          status: string
        }
        Insert: {
          bar_address?: string | null
          bar_latitude?: number | null
          bar_longitude?: number | null
          bar_name?: string | null
          bar_place_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          current_participants?: number
          id?: string
          is_scheduled?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_participants?: number
          meeting_time?: string | null
          reminder_sent?: boolean | null
          scheduled_for?: string | null
          search_radius?: number | null
          status?: string
        }
        Update: {
          bar_address?: string | null
          bar_latitude?: number | null
          bar_longitude?: number | null
          bar_name?: string | null
          bar_place_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          current_participants?: number
          id?: string
          is_scheduled?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_participants?: number
          meeting_time?: string | null
          reminder_sent?: boolean | null
          scheduled_for?: string | null
          search_radius?: number | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_outings_history: {
        Row: {
          bar_address: string
          bar_latitude: number | null
          bar_longitude: number | null
          bar_name: string
          completed_at: string
          created_at: string
          group_id: string
          id: string
          meeting_time: string
          participants_count: number
          rated_at: string | null
          user_id: string
          user_rating: number | null
          user_review: string | null
        }
        Insert: {
          bar_address: string
          bar_latitude?: number | null
          bar_longitude?: number | null
          bar_name: string
          completed_at?: string
          created_at?: string
          group_id: string
          id?: string
          meeting_time: string
          participants_count?: number
          rated_at?: string | null
          user_id: string
          user_rating?: number | null
          user_review?: string | null
        }
        Update: {
          bar_address?: string
          bar_latitude?: number | null
          bar_longitude?: number | null
          bar_name?: string
          completed_at?: string
          created_at?: string
          group_id?: string
          id?: string
          meeting_time?: string
          participants_count?: number
          rated_at?: string | null
          user_id?: string
          user_rating?: number | null
          user_review?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      can_view_group: {
        Args: { group_uuid: string }
        Returns: boolean
      }
      check_user_participation_limit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      create_group_with_participant: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_location_name: string
          p_user_id: string
        }
        Returns: {
          id: string
          status: string
          max_participants: number
          current_participants: number
          latitude: number
          longitude: number
          location_name: string
          search_radius: number
          created_at: string
        }[]
      }
      dissolve_old_groups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_group_ids: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      is_group_member: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_user_in_group: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      repair_missing_outings_history: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      transition_groups_to_completed: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_and_clean_message: {
        Args: { input_message: string }
        Returns: string
      }
      validate_bar_name: {
        Args: { input_name: string }
        Returns: boolean
      }
      validate_coordinates: {
        Args: { lat: number; lng: number }
        Returns: boolean
      }
      validate_coordinates_strict: {
        Args: { lat: number; lng: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
