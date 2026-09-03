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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_members: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          invited_by: string | null
          profile_id: string
          status: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          profile_id: string
          status?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          profile_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_reviews: {
        Row: {
          broker_id: string
          client_id: string
          comment: string | null
          created_at: string
          deal_id: string
          id: string
          rating: number
        }
        Insert: {
          broker_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          deal_id: string
          id?: string
          rating: number
        }
        Update: {
          broker_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "broker_reviews_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_matching_preferences: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          client_id: string
          created_at: string
          id: string
          matching_mode: string | null
          max_area_sqm: number | null
          max_rooms: number | null
          min_area_sqm: number | null
          min_rooms: number | null
          preferred_areas: string[] | null
          preferred_features: string[] | null
          property_types: string[] | null
          purchase_purpose: string | null
          required_features: string[] | null
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          client_id: string
          created_at?: string
          id?: string
          matching_mode?: string | null
          max_area_sqm?: number | null
          max_rooms?: number | null
          min_area_sqm?: number | null
          min_rooms?: number | null
          preferred_areas?: string[] | null
          preferred_features?: string[] | null
          property_types?: string[] | null
          purchase_purpose?: string | null
          required_features?: string[] | null
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          client_id?: string
          created_at?: string
          id?: string
          matching_mode?: string | null
          max_area_sqm?: number | null
          max_rooms?: number | null
          min_area_sqm?: number | null
          min_rooms?: number | null
          preferred_areas?: string[] | null
          preferred_features?: string[] | null
          property_types?: string[] | null
          purchase_purpose?: string | null
          required_features?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_matching_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          agency_id: string | null
          broker_id: string | null
          client_type: string
          created_at: string
          id: string
          last_contact_at: string | null
          looking_for: string | null
          marital_status: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          broker_id?: string | null
          client_type?: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          looking_for?: string | null
          marital_status?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          broker_id?: string | null
          client_type?: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          looking_for?: string | null
          marital_status?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          broker_id: string
          contract_id: string
          created_at: string
          id: string
          party_email: string | null
          party_name: string
          party_phone: string | null
          party_role: string
          provider: string
          provider_request_id: string | null
          signed_at: string | null
          signed_document_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          broker_id: string
          contract_id: string
          created_at?: string
          id?: string
          party_email?: string | null
          party_name: string
          party_phone?: string | null
          party_role: string
          provider?: string
          provider_request_id?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          broker_id?: string
          contract_id?: string
          created_at?: string
          id?: string
          party_email?: string | null
          party_name?: string
          party_phone?: string | null
          party_role?: string
          provider?: string
          provider_request_id?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          broker_id: string
          contract_type: string
          created_at: string
          crm_client_id: string | null
          deal_id: string | null
          generated_content: string | null
          id: string
          listing_id: string | null
          party_a: Json
          party_a_id_photo_url: string | null
          party_b: Json
          party_b_id_photo_url: string | null
          status: string
          terms: Json
          updated_at: string
        }
        Insert: {
          broker_id: string
          contract_type?: string
          created_at?: string
          crm_client_id?: string | null
          deal_id?: string | null
          generated_content?: string | null
          id?: string
          listing_id?: string | null
          party_a?: Json
          party_a_id_photo_url?: string | null
          party_b?: Json
          party_b_id_photo_url?: string | null
          status?: string
          terms?: Json
          updated_at?: string
        }
        Update: {
          broker_id?: string
          contract_type?: string
          created_at?: string
          crm_client_id?: string | null
          deal_id?: string | null
          generated_content?: string | null
          id?: string
          listing_id?: string | null
          party_a?: Json
          party_a_id_photo_url?: string | null
          party_b?: Json
          party_b_id_photo_url?: string | null
          status?: string
          terms?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_crm_client_id_fkey"
            columns: ["crm_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          ai_context_summary: Json | null
          ai_context_summary_updated_at: string | null
          broker_id: string
          client_id: string | null
          closed_at: string | null
          commission_percent: number | null
          created_at: string
          crm_client_id: string | null
          id: string
          last_activity_at: string
          listing_id: string | null
          stage: string
          status: string
        }
        Insert: {
          ai_context_summary?: Json | null
          ai_context_summary_updated_at?: string | null
          broker_id: string
          client_id?: string | null
          closed_at?: string | null
          commission_percent?: number | null
          created_at?: string
          crm_client_id?: string | null
          id?: string
          last_activity_at?: string
          listing_id?: string | null
          stage?: string
          status?: string
        }
        Update: {
          ai_context_summary?: Json | null
          ai_context_summary_updated_at?: string | null
          broker_id?: string
          client_id?: string | null
          closed_at?: string | null
          commission_percent?: number | null
          created_at?: string
          crm_client_id?: string | null
          id?: string
          last_activity_at?: string
          listing_id?: string | null
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_crm_client_id_fkey"
            columns: ["crm_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_documents: {
        Row: {
          broker_id: string
          created_at: string
          deal_id: string | null
          document_number: string | null
          egn: string | null
          file_path: string | null
          full_name: string
          id: string
          input_method: string
          role_in_deal: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          broker_id: string
          created_at?: string
          deal_id?: string | null
          document_number?: string | null
          egn?: string | null
          file_path?: string | null
          full_name: string
          id?: string
          input_method?: string
          role_in_deal?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          broker_id?: string
          created_at?: string
          deal_id?: string | null
          document_number?: string | null
          egn?: string | null
          file_path?: string | null
          full_name?: string
          id?: string
          input_method?: string
          role_in_deal?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          availability_status: string
          broker_confirmed: boolean
          broker_id: string
          broker_notes: string | null
          created_at: string
          deal_id: string | null
          document_subtype: string | null
          document_type: string
          extracted_data: Json | null
          file_path: string | null
          id: string
          listing_id: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: string
          broker_confirmed?: boolean
          broker_id: string
          broker_notes?: string | null
          created_at?: string
          deal_id?: string | null
          document_subtype?: string | null
          document_type: string
          extracted_data?: Json | null
          file_path?: string | null
          id?: string
          listing_id?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: string
          broker_confirmed?: boolean
          broker_id?: string
          broker_notes?: string | null
          created_at?: string
          deal_id?: string | null
          document_subtype?: string | null
          document_type?: string
          extracted_data?: Json | null
          file_path?: string | null
          id?: string
          listing_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          area_sqm: number | null
          broker_id: string
          city: string | null
          created_at: string
          description: string | null
          floor: number | null
          id: string
          neighborhood: string | null
          photos: string[]
          price_eur: number
          property_type: string
          rooms: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area_sqm?: number | null
          broker_id: string
          city?: string | null
          created_at?: string
          description?: string | null
          floor?: number | null
          id?: string
          neighborhood?: string | null
          photos?: string[]
          price_eur: number
          property_type: string
          rooms?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number | null
          broker_id?: string
          city?: string | null
          created_at?: string
          description?: string | null
          floor?: number | null
          id?: string
          neighborhood?: string | null
          photos?: string[]
          price_eur?: number
          property_type?: string
          rooms?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          bio: string | null
          broker_status: string
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          agency_name?: string | null
          bio?: string | null
          broker_status?: string
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          agency_name?: string | null
          bio?: string | null
          broker_status?: string
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          broker_id: string
          client_id: string | null
          completed: boolean
          created_at: string
          due_at: string
          id: string
          listing_id: string | null
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          broker_id: string
          client_id?: string | null
          completed?: boolean
          created_at?: string
          due_at: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          broker_id?: string
          client_id?: string | null
          completed?: boolean
          created_at?: string
          due_at?: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agency_creator: {
        Args: { _agency: string; _user: string }
        Returns: boolean
      }
      is_confirmed_agency_member: {
        Args: { _agency: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "broker" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["broker", "client"],
    },
  },
} as const
