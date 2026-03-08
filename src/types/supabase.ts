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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          appointment_time: string
          business_profile_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          missed_call_id: string | null
          notes: string | null
          payment_amount: number | null
          payment_status: string | null
          reschedule_token: string | null
          service_id: string | null
          service_type: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          appointment_time: string
          business_profile_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          missed_call_id?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          reschedule_token?: string | null
          service_id?: string | null
          service_type?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          appointment_time?: string
          business_profile_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          missed_call_id?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_status?: string | null
          reschedule_token?: string | null
          service_id?: string | null
          service_type?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          accent_color: string | null
          address: string | null
          available_hours: Json | null
          booking_slug: string
          business_name: string
          created_at: string
          dark_mode: boolean | null
          email: string | null
          id: string
          logo_url: string | null
          payments_enabled: boolean | null
          phone_number: string | null
          slot_duration: number | null
          stripe_account_id: string | null
          theme_color: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          available_hours?: Json | null
          booking_slug: string
          business_name: string
          created_at?: string
          dark_mode?: boolean | null
          email?: string | null
          id?: string
          logo_url?: string | null
          payments_enabled?: boolean | null
          phone_number?: string | null
          slot_duration?: number | null
          stripe_account_id?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          available_hours?: Json | null
          booking_slug?: string
          business_name?: string
          created_at?: string
          dark_mode?: boolean | null
          email?: string | null
          id?: string
          logo_url?: string | null
          payments_enabled?: boolean | null
          phone_number?: string | null
          slot_duration?: number | null
          stripe_account_id?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      call_forwarding_configs: {
        Row: {
          auto_text_enabled: boolean | null
          booking_slug: string | null
          created_at: string
          forward_to_number: string
          id: string
          is_active: boolean | null
          sms_message_template: string | null
          twilio_number: string | null
          twilio_number_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_text_enabled?: boolean | null
          booking_slug?: string | null
          created_at?: string
          forward_to_number: string
          id?: string
          is_active?: boolean | null
          sms_message_template?: string | null
          twilio_number?: string | null
          twilio_number_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_text_enabled?: boolean | null
          booking_slug?: string | null
          created_at?: string
          forward_to_number?: string
          id?: string
          is_active?: boolean | null
          sms_message_template?: string | null
          twilio_number?: string | null
          twilio_number_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_forwarding_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_duration: number | null
          call_status: string
          called_number: string
          caller_number: string
          created_at: string
          forward_to_number: string | null
          id: string
          missed_call_id: string | null
          raw_payload: Json | null
          twilio_call_sid: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          call_duration?: number | null
          call_status?: string
          called_number: string
          caller_number: string
          created_at?: string
          forward_to_number?: string | null
          id?: string
          missed_call_id?: string | null
          raw_payload?: Json | null
          twilio_call_sid: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          call_duration?: number | null
          call_status?: string
          called_number?: string
          caller_number?: string
          created_at?: string
          forward_to_number?: string | null
          id?: string
          missed_call_id?: string | null
          raw_payload?: Json | null
          twilio_call_sid?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_missed_call_id_fkey"
            columns: ["missed_call_id"]
            isOneToOne: false
            referencedRelation: "missed_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      missed_calls: {
        Row: {
          auto_texted: boolean | null
          call_direction: string | null
          called_at: string
          caller_name: string | null
          created_at: string
          id: string
          phone_number: string
          sms_sent_at: string | null
          status: string
          twilio_call_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_texted?: boolean | null
          call_direction?: string | null
          called_at?: string
          caller_name?: string | null
          created_at?: string
          id?: string
          phone_number: string
          sms_sent_at?: string | null
          status?: string
          twilio_call_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_texted?: boolean | null
          call_direction?: string | null
          called_at?: string
          caller_name?: string | null
          created_at?: string
          id?: string
          phone_number?: string
          sms_sent_at?: string | null
          status?: string
          twilio_call_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missed_calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      services: {
        Row: {
          business_profile_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          name: string
          payment_mode: string | null
          price: number
          sort_order: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_profile_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name: string
          payment_mode?: string | null
          price?: number
          sort_order?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_profile_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name?: string
          payment_mode?: string | null
          price?: number
          sort_order?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          booking_link_template: string | null
          booking_slug: string | null
          call_forwarding_enabled: boolean | null
          created_at: string
          forward_to_number: string | null
          id: string
          review_automation_enabled: boolean | null
          sms_message_template: string | null
          stripe_connect_id: string | null
          twilio_number: string | null
          twilio_number_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_link_template?: string | null
          booking_slug?: string | null
          call_forwarding_enabled?: boolean | null
          created_at?: string
          forward_to_number?: string | null
          id?: string
          review_automation_enabled?: boolean | null
          sms_message_template?: string | null
          stripe_connect_id?: string | null
          twilio_number?: string | null
          twilio_number_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_link_template?: string | null
          booking_slug?: string | null
          call_forwarding_enabled?: boolean | null
          created_at?: string
          forward_to_number?: string | null
          id?: string
          review_automation_enabled?: boolean | null
          sms_message_template?: string | null
          stripe_connect_id?: string | null
          twilio_number?: string | null
          twilio_number_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          cancel_at_period_end: boolean | null
          canceled_at: number | null
          created_at: string
          currency: string | null
          current_period_end: number | null
          current_period_start: number | null
          custom_field_data: Json | null
          customer_cancellation_comment: string | null
          customer_cancellation_reason: string | null
          customer_id: string | null
          ended_at: number | null
          ends_at: number | null
          id: string
          interval: string | null
          metadata: Json | null
          price_id: string | null
          started_at: number | null
          status: string | null
          stripe_id: string | null
          stripe_price_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          custom_field_data?: Json | null
          customer_cancellation_comment?: string | null
          customer_cancellation_reason?: string | null
          customer_id?: string | null
          ended_at?: number | null
          ends_at?: number | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          price_id?: string | null
          started_at?: number | null
          status?: string | null
          stripe_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          custom_field_data?: Json | null
          customer_cancellation_comment?: string | null
          customer_cancellation_reason?: string | null
          customer_id?: string | null
          ended_at?: number | null
          ends_at?: number | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          price_id?: string | null
          started_at?: number | null
          status?: string | null
          stripe_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: string | null
          email: string | null
          full_name: string | null
          id: string
          image: string | null
          name: string | null
          stripe_account_id: string | null
          subscription: string | null
          token_identifier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          image?: string | null
          name?: string | null
          stripe_account_id?: string | null
          subscription?: string | null
          token_identifier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string | null
          stripe_account_id?: string | null
          subscription?: string | null
          token_identifier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          modified_at: string
          stripe_event_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          modified_at?: string
          stripe_event_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          modified_at?: string
          stripe_event_id?: string | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
