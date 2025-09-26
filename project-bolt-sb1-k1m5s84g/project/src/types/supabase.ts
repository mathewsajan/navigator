export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          notification_preferences: Json
          last_active_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          notification_preferences?: Json
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          notification_preferences?: Json
          last_active_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
          max_members: number
          is_active: boolean
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_by: string
          created_at?: string
          updated_at?: string
          max_members?: number
          is_active?: boolean
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          max_members?: number
          is_active?: boolean
          description?: string | null
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'owner' | 'member'
          joined_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          joined_at?: string
          is_active?: boolean
        }
      }
      properties: {
        Row: {
          id: string
          team_id: string
          created_by: string
          address: string
          city: string
          province: string
          postal_code: string
          listing_price: number | null
          property_type: string
          bedrooms: number | null
          bathrooms: number | null
          square_feet: number | null
          lot_size_sqft: number | null
          year_built: number | null
          mls_number: string | null
          listing_url: string | null
          notes: string | null
          status: string
          visit_date: string | null
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          created_by: string
          address: string
          city: string
          province?: string
          postal_code: string
          listing_price?: number | null
          property_type?: string
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          lot_size_sqft?: number | null
          year_built?: number | null
          mls_number?: string | null
          listing_url?: string | null
          notes?: string | null
          status?: string
          visit_date?: string | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          created_by?: string
          address?: string
          city?: string
          province?: string
          postal_code?: string
          listing_price?: number | null
          property_type?: string
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          lot_size_sqft?: number | null
          year_built?: number | null
          mls_number?: string | null
          listing_url?: string | null
          notes?: string | null
          status?: string
          visit_date?: string | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
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
  }
}