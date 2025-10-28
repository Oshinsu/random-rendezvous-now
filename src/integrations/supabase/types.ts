export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          started_at: string | null
          status: string
          test_name: string
          updated_at: string
          variant_a_clicks: number | null
          variant_a_content: string
          variant_a_conversions: number | null
          variant_a_opens: number | null
          variant_a_sends: number | null
          variant_a_subject: string
          variant_b_clicks: number | null
          variant_b_content: string
          variant_b_conversions: number | null
          variant_b_opens: number | null
          variant_b_sends: number | null
          variant_b_subject: string
          winner: string | null
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          test_name: string
          updated_at?: string
          variant_a_clicks?: number | null
          variant_a_content: string
          variant_a_conversions?: number | null
          variant_a_opens?: number | null
          variant_a_sends?: number | null
          variant_a_subject: string
          variant_b_clicks?: number | null
          variant_b_content: string
          variant_b_conversions?: number | null
          variant_b_opens?: number | null
          variant_b_sends?: number | null
          variant_b_subject: string
          winner?: string | null
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
          test_name?: string
          updated_at?: string
          variant_a_clicks?: number | null
          variant_a_content?: string
          variant_a_conversions?: number | null
          variant_a_opens?: number | null
          variant_a_sends?: number | null
          variant_a_subject?: string
          variant_b_clicks?: number | null
          variant_b_content?: string
          variant_b_conversions?: number | null
          variant_b_opens?: number | null
          variant_b_sends?: number | null
          variant_b_subject?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      api_requests_log: {
        Row: {
          api_name: string
          cost_usd: number | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          group_id: string | null
          id: string
          metadata: Json | null
          request_type: string
          response_time_ms: number | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          api_name?: string
          cost_usd?: number | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          group_id?: string | null
          id?: string
          metadata?: Json | null
          request_type: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          api_name?: string
          cost_usd?: number | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          group_id?: string | null
          id?: string
          metadata?: Json | null
          request_type?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      bar_analytics_reports: {
        Row: {
          bar_owner_id: string
          estimated_revenue_eur: number
          generated_at: string
          id: string
          peak_hours: Json | null
          report_month: string
          total_customers: number
          total_groups: number
          weekly_breakdown: Json | null
        }
        Insert: {
          bar_owner_id: string
          estimated_revenue_eur?: number
          generated_at?: string
          id?: string
          peak_hours?: Json | null
          report_month: string
          total_customers?: number
          total_groups?: number
          weekly_breakdown?: Json | null
        }
        Update: {
          bar_owner_id?: string
          estimated_revenue_eur?: number
          generated_at?: string
          id?: string
          peak_hours?: Json | null
          report_month?: string
          total_customers?: number
          total_groups?: number
          weekly_breakdown?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_analytics_reports_bar_owner_id_fkey"
            columns: ["bar_owner_id"]
            isOneToOne: false
            referencedRelation: "bar_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_owners: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bar_address: string
          bar_name: string
          bar_place_id: string | null
          business_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
          verification_documents: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bar_address: string
          bar_name: string
          bar_place_id?: string | null
          business_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          verification_documents?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bar_address?: string
          bar_name?: string
          bar_place_id?: string | null
          business_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verification_documents?: Json | null
        }
        Relationships: []
      }
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
      blog_articles: {
        Row: {
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          generated_by_ai: boolean
          id: string
          keyword_id: string | null
          meta_description: string
          meta_title: string
          published_at: string | null
          seo_score: number | null
          slug: string
          status: string
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          generated_by_ai?: boolean
          id?: string
          keyword_id?: string | null
          meta_description: string
          meta_title: string
          published_at?: string | null
          seo_score?: number | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          generated_by_ai?: boolean
          id?: string
          keyword_id?: string | null
          meta_description?: string
          meta_title?: string
          published_at?: string | null
          seo_score?: number | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_articles_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "blog_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_generation_schedule: {
        Row: {
          frequency_days: number
          id: string
          is_active: boolean
          last_generation_at: string | null
          next_generation_at: string | null
          total_generated: number
          updated_at: string
        }
        Insert: {
          frequency_days?: number
          id?: string
          is_active?: boolean
          last_generation_at?: string | null
          next_generation_at?: string | null
          total_generated?: number
          updated_at?: string
        }
        Update: {
          frequency_days?: number
          id?: string
          is_active?: boolean
          last_generation_at?: string | null
          next_generation_at?: string | null
          total_generated?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_keywords: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          keyword: string
          last_used_at: string | null
          notes: string | null
          priority: number
          status: string
          times_used: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          keyword: string
          last_used_at?: string | null
          notes?: string | null
          priority?: number
          status?: string
          times_used?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          keyword?: string
          last_used_at?: string | null
          notes?: string | null
          priority?: number
          status?: string
          times_used?: number
        }
        Relationships: []
      }
      crm_campaign_sends: {
        Row: {
          bounced: boolean | null
          campaign_id: string
          clicked_at: string | null
          converted_at: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          sent_at: string
          unsubscribed: boolean | null
          user_id: string
        }
        Insert: {
          bounced?: boolean | null
          campaign_id: string
          clicked_at?: string | null
          converted_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string
          unsubscribed?: boolean | null
          user_id: string
        }
        Update: {
          bounced?: boolean | null
          campaign_id?: string
          clicked_at?: string | null
          converted_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string
          unsubscribed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaigns: {
        Row: {
          campaign_name: string
          campaign_type: string
          channels: string[] | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          send_at: string | null
          status: string
          subject: string | null
          target_lifecycle_stage_id: string | null
          target_segment_id: string | null
          template_data: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          campaign_name: string
          campaign_type: string
          channels?: string[] | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          send_at?: string | null
          status?: string
          subject?: string | null
          target_lifecycle_stage_id?: string | null
          target_segment_id?: string | null
          template_data?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          campaign_name?: string
          campaign_type?: string
          channels?: string[] | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          send_at?: string | null
          status?: string
          subject?: string | null
          target_lifecycle_stage_id?: string | null
          target_segment_id?: string | null
          template_data?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaigns_target_lifecycle_stage_id_fkey"
            columns: ["target_lifecycle_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_lifecycle_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaigns_target_segment_id_fkey"
            columns: ["target_segment_id"]
            isOneToOne: false
            referencedRelation: "crm_user_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lifecycle_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          stage_key: string
          stage_name: string
          trigger_conditions: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          stage_key: string
          stage_name: string
          trigger_conditions?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          stage_key?: string
          stage_name?: string
          trigger_conditions?: Json | null
        }
        Relationships: []
      }
      crm_referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          reward_amount: number | null
          reward_given_at: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          reward_amount?: number | null
          reward_given_at?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_amount?: number | null
          reward_given_at?: string | null
          status?: string
        }
        Relationships: []
      }
      crm_user_feedback: {
        Row: {
          context: Json | null
          created_at: string
          feedback_text: string | null
          feedback_type: string
          group_id: string | null
          id: string
          rating: number | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          feedback_text?: string | null
          feedback_type: string
          group_id?: string | null
          id?: string
          rating?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string
          group_id?: string | null
          id?: string
          rating?: number | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_user_health: {
        Row: {
          avg_days_between_outings: number | null
          calculated_at: string
          churn_risk: string
          days_since_last_activity: number | null
          days_since_last_login: number | null
          days_since_signup: number
          health_score: number
          id: string
          last_activity_at: string | null
          last_login_at: string | null
          metadata: Json | null
          never_logged_in: boolean | null
          total_groups: number
          total_logins: number | null
          total_outings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_days_between_outings?: number | null
          calculated_at?: string
          churn_risk?: string
          days_since_last_activity?: number | null
          days_since_last_login?: number | null
          days_since_signup?: number
          health_score?: number
          id?: string
          last_activity_at?: string | null
          last_login_at?: string | null
          metadata?: Json | null
          never_logged_in?: boolean | null
          total_groups?: number
          total_logins?: number | null
          total_outings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_days_between_outings?: number | null
          calculated_at?: string
          churn_risk?: string
          days_since_last_activity?: number | null
          days_since_last_login?: number | null
          days_since_signup?: number
          health_score?: number
          id?: string
          last_activity_at?: string | null
          last_login_at?: string | null
          metadata?: Json | null
          never_logged_in?: boolean | null
          total_groups?: number
          total_logins?: number | null
          total_outings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_user_lifecycle: {
        Row: {
          entered_at: string
          exited_at: string | null
          id: string
          is_current: boolean
          stage_id: string
          user_id: string
        }
        Insert: {
          entered_at?: string
          exited_at?: string | null
          id?: string
          is_current?: boolean
          stage_id: string
          user_id: string
        }
        Update: {
          entered_at?: string
          exited_at?: string | null
          id?: string
          is_current?: boolean
          stage_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_user_lifecycle_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_lifecycle_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_user_segment_memberships: {
        Row: {
          assigned_at: string
          id: string
          segment_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          segment_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_user_segment_memberships_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "crm_user_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_user_segments: {
        Row: {
          color: string | null
          created_at: string
          criteria: Json
          description: string | null
          id: string
          segment_key: string
          segment_name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          segment_key: string
          segment_name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          criteria?: Json
          description?: string | null
          id?: string
          segment_key?: string
          segment_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_force_confirm_votes: {
        Row: {
          group_id: string
          id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          group_id: string
          id?: string
          user_id: string
          voted_at?: string
        }
        Update: {
          group_id?: string
          id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_force_confirm_votes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_force_confirm_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      group_payments: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          group_id: string
          id: string
          metadata: Json | null
          payment_deadline: string
          status: string
          stripe_session_id: string | null
          total_amount_cents: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          group_id: string
          id?: string
          metadata?: Json | null
          payment_deadline?: string
          status?: string
          stripe_session_id?: string | null
          total_amount_cents?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          group_id?: string
          id?: string
          metadata?: Json | null
          payment_deadline?: string
          status?: string
          stripe_session_id?: string | null
          total_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_group_payments_group"
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
          bar_address_manual: string | null
          bar_latitude: number | null
          bar_longitude: number | null
          bar_name: string | null
          bar_name_manual: string | null
          bar_place_id: string | null
          city_name: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          current_participants: number
          id: string
          is_scheduled: boolean | null
          is_test_group: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          max_participants: number
          meeting_time: string | null
          reminder_sent: boolean | null
          scheduled_for: string | null
          search_radius: number | null
          status: string
          updated_at: string
        }
        Insert: {
          bar_address?: string | null
          bar_address_manual?: string | null
          bar_latitude?: number | null
          bar_longitude?: number | null
          bar_name?: string | null
          bar_name_manual?: string | null
          bar_place_id?: string | null
          city_name?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          current_participants?: number
          id?: string
          is_scheduled?: boolean | null
          is_test_group?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_participants?: number
          meeting_time?: string | null
          reminder_sent?: boolean | null
          scheduled_for?: string | null
          search_radius?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          bar_address?: string | null
          bar_address_manual?: string | null
          bar_latitude?: number | null
          bar_longitude?: number | null
          bar_name?: string | null
          bar_name_manual?: string | null
          bar_place_id?: string | null
          city_name?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          current_participants?: number
          id?: string
          is_scheduled?: boolean | null
          is_test_group?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_participants?: number
          meeting_time?: string | null
          reminder_sent?: boolean | null
          scheduled_for?: string | null
          search_radius?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_payments: {
        Row: {
          amount_cents: number
          created_at: string
          group_payment_id: string
          id: string
          metadata: Json | null
          paid_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          group_payment_id: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          group_payment_id?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_member_payments_group_payment"
            columns: ["group_payment_id"]
            isOneToOne: false
            referencedRelation: "group_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_analytics: {
        Row: {
          created_at: string | null
          device_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          notification_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          notification_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          notification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_analytics_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["id"]
          },
        ]
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
      security_audit_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_config: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: Json
          created_at: string
          description: string | null
          id: string
          page_section: string
          updated_at: string
        }
        Insert: {
          content_key: string
          content_type: string
          content_value: Json
          created_at?: string
          description?: string | null
          id?: string
          page_section: string
          updated_at?: string
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          page_section?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      user_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          group_id: string | null
          id: string
          metadata: Json | null
          referral_id: string | null
          source: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          group_id?: string | null
          id?: string
          metadata?: Json | null
          referral_id?: string | null
          source: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          group_id?: string | null
          id?: string
          metadata?: Json | null
          referral_id?: string | null
          source?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credit_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_credit_transactions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "crm_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string
          credits_available: number | null
          credits_used: number
          id: string
          total_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_available?: number | null
          credits_used?: number
          id?: string
          total_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_available?: number | null
          credits_used?: number
          id?: string
          total_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_email_preferences: {
        Row: {
          all_emails_disabled: boolean
          created_at: string
          group_notifications: boolean
          id: string
          marketing_emails: boolean
          newsletter: boolean
          scheduled_reminders: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          all_emails_disabled?: boolean
          created_at?: string
          group_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          newsletter?: boolean
          scheduled_reminders?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          all_emails_disabled?: boolean
          created_at?: string
          group_notifications?: boolean
          id?: string
          marketing_emails?: boolean
          newsletter?: boolean
          scheduled_reminders?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_url: string | null
          body: string
          clicked_at: string | null
          created_at: string | null
          data: Json | null
          icon: string | null
          id: string
          image: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          clicked_at?: string | null
          created_at?: string | null
          data?: Json | null
          icon?: string | null
          id?: string
          image?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          clicked_at?: string | null
          created_at?: string | null
          data?: Json | null
          icon?: string | null
          id?: string
          image?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
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
      user_push_tokens: {
        Row: {
          created_at: string | null
          device_name: string | null
          device_type: string
          id: string
          last_used_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          device_type: string
          id?: string
          last_used_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          device_type?: string
          id?: string
          last_used_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_ready_scheduled_groups: { Args: never; Returns: number }
      add_user_credits: {
        Args: {
          amount: number
          group_id?: string
          referral_id?: string
          source: string
          target_user_id: string
          transaction_type: string
        }
        Returns: undefined
      }
      assign_user_segments: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_user_health_score: {
        Args: { target_user_id: string }
        Returns: number
      }
      can_view_group: { Args: { group_uuid: string }; Returns: boolean }
      check_group_payment_completion: {
        Args: { target_group_id: string }
        Returns: boolean
      }
      check_user_participation_limit: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      cleanup_expired_force_confirm_votes: { Args: never; Returns: number }
      cleanup_old_security_logs: { Args: never; Returns: undefined }
      create_group_with_participant: {
        Args: {
          p_latitude: number
          p_location_name: string
          p_longitude: number
          p_user_id: string
        }
        Returns: {
          created_at: string
          current_participants: number
          id: string
          latitude: number
          location_name: string
          longitude: number
          max_participants: number
          search_radius: number
          status: string
        }[]
      }
      create_in_app_notification: {
        Args: {
          notif_action_url?: string
          notif_body: string
          notif_data?: Json
          notif_icon?: string
          notif_title: string
          notif_type: string
          target_user_id: string
        }
        Returns: string
      }
      delete_user_account: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      dissolve_old_groups: { Args: never; Returns: undefined }
      find_compatible_group_fixed: {
        Args: {
          search_radius?: number
          user_latitude: number
          user_longitude: number
        }
        Returns: {
          current_participants: number
          distance_meters: number
          id: string
          latitude: number
          location_name: string
          longitude: number
          max_participants: number
          status: string
        }[]
      }
      force_confirm_incomplete_group: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: Json
      }
      generate_bar_analytics: {
        Args: { target_bar_place_id: string; target_month: string }
        Returns: Json
      }
      get_admin_stats: { Args: never; Returns: Json }
      get_all_users_admin: {
        Args: never
        Returns: {
          active_groups_count: number
          created_at: string
          email: string
          email_confirmed_at: string
          first_name: string
          id: string
          last_name: string
          last_sign_in_at: string
          total_outings_count: number
        }[]
      }
      get_comprehensive_admin_stats: { Args: never; Returns: Json }
      get_ppu_config: { Args: never; Returns: Json }
      get_ppu_price_cents: { Args: never; Returns: number }
      get_security_stats: { Args: never; Returns: Json }
      get_signup_stats: {
        Args: { period_end: string; period_start: string }
        Returns: Json
      }
      get_system_setting: { Args: { setting_name: string }; Returns: Json }
      get_user_active_groups: {
        Args: { include_scheduled?: boolean; user_uuid: string }
        Returns: {
          bar_address: string
          bar_latitude: number
          bar_longitude: number
          bar_name: string
          bar_place_id: string
          created_at: string
          current_participants: number
          group_id: string
          group_status: string
          is_scheduled: boolean
          joined_at: string
          last_seen: string
          latitude: number
          location_name: string
          longitude: number
          max_participants: number
          meeting_time: string
          participation_id: string
          scheduled_for: string
          search_radius: number
        }[]
      }
      get_user_details_admin: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_user_group_ids: { Args: { user_uuid: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_article_views: {
        Args: { article_id: string }
        Returns: undefined
      }
      initiate_group_payment: {
        Args: { target_group_id: string }
        Returns: string
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_bar_owner: { Args: never; Returns: boolean }
      is_group_member: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_ppu_mode_enabled: { Args: never; Returns: boolean }
      is_user_connected_realtime: {
        Args: { p_last_seen: string }
        Returns: boolean
      }
      is_user_in_group: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      migrate_existing_users: { Args: never; Returns: number }
      repair_missing_outings_history: { Args: never; Returns: number }
      sanitize_coordinates_pg: {
        Args: { lat: number; lng: number }
        Returns: {
          sanitized_lat: number
          sanitized_lng: number
        }[]
      }
      test_trigger_auto_bar_assignment: { Args: never; Returns: Json }
      transition_groups_to_completed: { Args: never; Returns: undefined }
      update_system_setting: {
        Args: { new_value: Json; setting_name: string }
        Returns: undefined
      }
      update_user_lifecycle_stage: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      validate_and_clean_message: {
        Args: { input_message: string }
        Returns: string
      }
      validate_bar_name: { Args: { input_name: string }; Returns: boolean }
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
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
