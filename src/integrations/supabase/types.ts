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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          claim_status: Database["public"]["Enums"]["item_claim_status"]
          contact_info: string | null
          created_at: string | null
          date_reported: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          status: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          claim_status?: Database["public"]["Enums"]["item_claim_status"]
          contact_info?: string | null
          created_at?: string | null
          date_reported?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          status: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          claim_status?: Database["public"]["Enums"]["item_claim_status"]
          contact_info?: string | null
          created_at?: string | null
          date_reported?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      claims: {
        Row: {
          id: string
          item_id: string
          claimant_id: string
          verification_details: string | null
          status: Database["public"]["Enums"]["claim_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          claimant_id: string
          verification_details?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          claimant_id?: string
          verification_details?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          item_id: string
          participant1_id: string
          participant2_id: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          participant1_id: string
          participant2_id: string
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          participant1_id?: string
          participant2_id?: string
          last_message_at?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          message: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          message: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
          title?: string
          message?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          lost_item_id: string
          found_item_id: string
          confidence_score: number
          match_reasons: string[] | null
          status: Database["public"]["Enums"]["match_status"]
          created_at: string
        }
        Insert: {
          id?: string
          lost_item_id: string
          found_item_id: string
          confidence_score: number
          match_reasons?: string[] | null
          status?: Database["public"]["Enums"]["match_status"]
          created_at?: string
        }
        Update: {
          id?: string
          lost_item_id?: string
          found_item_id?: string
          confidence_score?: number
          match_reasons?: string[] | null
          status?: Database["public"]["Enums"]["match_status"]
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_dashboard_stats: {
        Row: {
          user_id: string
          lost_items_count: number | null
          found_items_count: number | null
          successful_claims_count: number | null
          unread_messages_count: number | null
          unread_notifications_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_or_create_conversation: {
        Args: {
          p_item_id: string
          p_user1_id: string
          p_user2_id: string
        }
        Returns: string
      }
      get_unread_notification_count: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_unread_message_count: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      item_category:
        | "phone"
        | "keys"
        | "stationery"
        | "electronics"
        | "wallet"
        | "clothing"
        | "other"
      item_status: "lost" | "found"
      claim_status: "pending" | "approved" | "rejected" | "returned"
      item_claim_status: "open" | "pending" | "claimed" | "returned" | "closed"
      notification_type: "claim" | "message" | "match" | "status" | "system"
      match_status: "pending" | "reviewed" | "confirmed" | "rejected"
      user_role: "user" | "moderator" | "admin"
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
      item_category: [
        "phone",
        "keys",
        "stationery",
        "electronics",
        "wallet",
        "clothing",
        "other",
      ],
      item_status: ["lost", "found"],
      claim_status: ["pending", "approved", "rejected", "returned"],
      item_claim_status: ["open", "pending", "claimed", "returned", "closed"],
      notification_type: ["claim", "message", "match", "status", "system"],
      match_status: ["pending", "reviewed", "confirmed", "rejected"],
      user_role: ["user", "moderator", "admin"],
    },
  },
} as const
