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
          broker_id: string
          client_type: string
          created_at: string
          id: string
          last_contact_at: string | null
          looking_for: string | null
          marital_status: string | null
          name: string
          notes: string | null
          phone: string | null
          source_post_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          broker_id: string
          client_type?: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          looking_for?: string | null
          marital_status?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source_post_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          broker_id?: string
          client_type?: string
          created_at?: string
          id?: string
          last_contact_at?: string | null
          looking_for?: string | null
          marital_status?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source_post_id?: string | null
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
          {
            foreignKeyName: "clients_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_channels: {
        Row: {
          agency_id: string | null
          broker_id: string
          code: string
          contact_block: string | null
          created_at: string
          hashtags_max: number | null
          hashtags_min: number | null
          id: string
          is_active: boolean
          name: string
          platform: string
          role: string | null
          show_broker: boolean
          sort_order: number
          tone: string | null
          updated_at: string
          weekly_target: number
        }
        Insert: {
          agency_id?: string | null
          broker_id: string
          code: string
          contact_block?: string | null
          created_at?: string
          hashtags_max?: number | null
          hashtags_min?: number | null
          id?: string
          is_active?: boolean
          name: string
          platform: string
          role?: string | null
          show_broker?: boolean
          sort_order?: number
          tone?: string | null
          updated_at?: string
          weekly_target?: number
        }
        Update: {
          agency_id?: string | null
          broker_id?: string
          code?: string
          contact_block?: string | null
          created_at?: string
          hashtags_max?: number | null
          hashtags_min?: number | null
          id?: string
          is_active?: boolean
          name?: string
          platform?: string
          role?: string | null
          show_broker?: boolean
          sort_order?: number
          tone?: string | null
          updated_at?: string
          weekly_target?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_channels_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_knowledge: {
        Row: {
          broker_id: string
          chunk_index: number
          content: string
          created_at: string
          district: string | null
          embedding: string | null
          id: string
          post_id: string
          topic_type: string | null
        }
        Insert: {
          broker_id: string
          chunk_index?: number
          content: string
          created_at?: string
          district?: string | null
          embedding?: string | null
          id?: string
          post_id: string
          topic_type?: string | null
        }
        Update: {
          broker_id?: string
          chunk_index?: number
          content?: string
          created_at?: string
          district?: string | null
          embedding?: string | null
          id?: string
          post_id?: string
          topic_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_knowledge_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          agency_id: string | null
          ai_generated: boolean
          ai_model: string | null
          archived_at: string | null
          body: string | null
          broker_id: string
          channel_id: string
          code: string
          created_at: string
          format: string
          id: string
          links_to_post_id: string | null
          media: Json
          published_at: string | null
          published_url: string | null
          scheduled_at: string | null
          slug: string | null
          status: string
          summary: string | null
          title: string | null
          topic_id: string
          updated_at: string
          visual_brief: string | null
        }
        Insert: {
          agency_id?: string | null
          ai_generated?: boolean
          ai_model?: string | null
          archived_at?: string | null
          body?: string | null
          broker_id: string
          channel_id: string
          code: string
          created_at?: string
          format?: string
          id?: string
          links_to_post_id?: string | null
          media?: Json
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title?: string | null
          topic_id: string
          updated_at?: string
          visual_brief?: string | null
        }
        Update: {
          agency_id?: string | null
          ai_generated?: boolean
          ai_model?: string | null
          archived_at?: string | null
          body?: string | null
          broker_id?: string
          channel_id?: string
          code?: string
          created_at?: string
          format?: string
          id?: string
          links_to_post_id?: string | null
          media?: Json
          published_at?: string | null
          published_url?: string | null
          scheduled_at?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title?: string | null
          topic_id?: string
          updated_at?: string
          visual_brief?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "content_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_links_to_post_id_fkey"
            columns: ["links_to_post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "content_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      content_results: {
        Row: {
          broker_id: string
          comments: number | null
          created_at: string
          id: string
          leads: number | null
          measured_at: string
          messages: number | null
          notes: string | null
          post_id: string
          reach: number | null
          reactions: number | null
          shares: number | null
          views: number | null
        }
        Insert: {
          broker_id: string
          comments?: number | null
          created_at?: string
          id?: string
          leads?: number | null
          measured_at?: string
          messages?: number | null
          notes?: string | null
          post_id: string
          reach?: number | null
          reactions?: number | null
          shares?: number | null
          views?: number | null
        }
        Update: {
          broker_id?: string
          comments?: number | null
          created_at?: string
          id?: string
          leads?: number | null
          measured_at?: string
          messages?: number | null
          notes?: string | null
          post_id?: string
          reach?: number | null
          reactions?: number | null
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_results_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_topic_listings: {
        Row: {
          created_at: string
          listing_id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          topic_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_topic_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_topic_listings_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "content_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      content_topics: {
        Row: {
          agency_id: string | null
          audience: string | null
          broker_id: string
          created_at: string
          deal_id: string | null
          district: string | null
          id: string
          key_insight: string | null
          number: number
          raw_notes: string | null
          ref_number: string | null
          source: string | null
          status: string
          title: string
          topic_type: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          audience?: string | null
          broker_id: string
          created_at?: string
          deal_id?: string | null
          district?: string | null
          id?: string
          key_insight?: string | null
          number: number
          raw_notes?: string | null
          ref_number?: string | null
          source?: string | null
          status?: string
          title: string
          topic_type?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          audience?: string | null
          broker_id?: string
          created_at?: string
          deal_id?: string | null
          district?: string | null
          id?: string
          key_insight?: string | null
          number?: number
          raw_notes?: string | null
          ref_number?: string | null
          source?: string | null
          status?: string
          title?: string
          topic_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_topics_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_topics_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      deal_participants: {
        Row: {
          client_id: string
          created_at: string
          deal_id: string
          id: string
          role: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deal_id: string
          id?: string
          role: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deal_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_participants_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_participants_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          broker_id: string
          changed_at: string
          changed_by: string | null
          deal_id: string
          from_stage: string | null
          id: string
          to_stage: string
        }
        Insert: {
          broker_id: string
          changed_at?: string
          changed_by?: string | null
          deal_id: string
          from_stage?: string | null
          id?: string
          to_stage: string
        }
        Update: {
          broker_id?: string
          changed_at?: string
          changed_by?: string | null
          deal_id?: string
          from_stage?: string | null
          id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
          transaction_type: string
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
          transaction_type?: string
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
          transaction_type?: string
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
      knowledge_chunks: {
        Row: {
          content: string
          created_at: string
          document_type: string
          effective_date: string | null
          embedding: string | null
          id: string
          section: string | null
          source: string
          status: string
          updated_at: string
          version: string | null
        }
        Insert: {
          content: string
          created_at?: string
          document_type: string
          effective_date?: string | null
          embedding?: string | null
          id?: string
          section?: string | null
          source: string
          status?: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string
          effective_date?: string | null
          embedding?: string | null
          id?: string
          section?: string | null
          source?: string
          status?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
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
          ref_number: string | null
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
          ref_number?: string | null
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
          ref_number?: string | null
          rooms?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_listing_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          listing_id: string
          message: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id: string
          message?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_listing_alerts_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings_raw"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listing_price_history: {
        Row: {
          id: string
          listing_id: string
          price_eur: number
          recorded_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          price_eur: number
          recorded_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          price_eur?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_listing_price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings_raw"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listings_raw: {
        Row: {
          area_sqm: number | null
          category: string | null
          city: string
          created_at: string
          date_label: string | null
          description: string | null
          first_seen_at: string
          id: string
          is_from_investor: boolean
          is_new_construction: boolean
          last_seen_at: string
          listing_date: string | null
          neighborhood: string | null
          photo_url: string | null
          price_eur: number
          price_per_sqm: number | null
          property_type: string | null
          source: string
          source_listing_id: string | null
          status: string
          title: string | null
          transaction_type: string | null
          updated_at: string
          urgency: string | null
          url: string
        }
        Insert: {
          area_sqm?: number | null
          category?: string | null
          city?: string
          created_at?: string
          date_label?: string | null
          description?: string | null
          first_seen_at?: string
          id?: string
          is_from_investor?: boolean
          is_new_construction?: boolean
          last_seen_at?: string
          listing_date?: string | null
          neighborhood?: string | null
          photo_url?: string | null
          price_eur: number
          price_per_sqm?: number | null
          property_type?: string | null
          source: string
          source_listing_id?: string | null
          status?: string
          title?: string | null
          transaction_type?: string | null
          updated_at?: string
          urgency?: string | null
          url: string
        }
        Update: {
          area_sqm?: number | null
          category?: string | null
          city?: string
          created_at?: string
          date_label?: string | null
          description?: string | null
          first_seen_at?: string
          id?: string
          is_from_investor?: boolean
          is_new_construction?: boolean
          last_seen_at?: string
          listing_date?: string | null
          neighborhood?: string | null
          photo_url?: string | null
          price_eur?: number
          price_per_sqm?: number | null
          property_type?: string | null
          source?: string
          source_listing_id?: string | null
          status?: string
          title?: string | null
          transaction_type?: string | null
          updated_at?: string
          urgency?: string | null
          url?: string
        }
        Relationships: []
      }
      market_neighborhood_stats: {
        Row: {
          active_listings_count: number | null
          avg_price_change_pct: number | null
          avg_price_per_sqm: number | null
          computed_at: string
          id: string
          median_price_per_sqm: number | null
          neighborhood: string
          period_month: string
          transaction_type: string | null
        }
        Insert: {
          active_listings_count?: number | null
          avg_price_change_pct?: number | null
          avg_price_per_sqm?: number | null
          computed_at?: string
          id?: string
          median_price_per_sqm?: number | null
          neighborhood: string
          period_month: string
          transaction_type?: string | null
        }
        Update: {
          active_listings_count?: number | null
          avg_price_change_pct?: number | null
          avg_price_per_sqm?: number | null
          computed_at?: string
          id?: string
          median_price_per_sqm?: number | null
          neighborhood?: string
          period_month?: string
          transaction_type?: string | null
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
          role_selection_pending: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_selection_pending?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_selection_pending?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_can_review_deal: {
        Args: { _broker: string; _deal: string }
        Returns: boolean
      }
      decode_embedding_i16: {
        Args: { b64: string; scale?: number }
        Returns: string
      }
      get_my_client_deals: {
        Args: never
        Returns: {
          broker_id: string
          broker_name: string
          closed_at: string
          created_at: string
          id: string
          listing_id: string
          listing_title: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ingest_chunks_via_gemini: {
        Args: { chunks: Json; max_retries?: number; request_delay_ms?: number }
        Returns: number
      }
      insert_knowledge_chunks: { Args: { rows: Json }; Returns: number }
      is_agency_creator: {
        Args: { _agency: string; _user: string }
        Returns: boolean
      }
      is_confirmed_agency_member: {
        Args: { _agency: string; _user: string }
        Returns: boolean
      }
      next_broker_seq: {
        Args: { _broker: string; _table: string }
        Returns: number
      }
      set_initial_role: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      set_my_role: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      update_knowledge_chunk_embeddings: {
        Args: { rows: Json }
        Returns: number
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
