export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          preferences: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          preferences?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          preferences?: Record<string, any> | null
          updated_at?: string
        }
      }
      travel_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          destination: string
          start_date: string
          end_date: string
          budget: number
          participants: number
          preferences: Record<string, any>
          itinerary: Record<string, any> | null
          status: 'draft' | 'planned' | 'active' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          destination: string
          start_date: string
          end_date: string
          budget: number
          participants: number
          preferences: Record<string, any>
          itinerary?: Record<string, any> | null
          status?: 'draft' | 'planned' | 'active' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          destination?: string
          start_date?: string
          end_date?: string
          budget?: number
          participants?: number
          preferences?: Record<string, any>
          itinerary?: Record<string, any> | null
          status?: 'draft' | 'planned' | 'active' | 'completed'
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          plan_id: string
          category: string
          amount: number
          description: string
          location: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          category: string
          amount: number
          description: string
          location?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          category?: string
          amount?: number
          description?: string
          location?: string | null
          date?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
