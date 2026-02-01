export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          budget: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color?: string
          budget?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          budget?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          id: string
          product_id: string
          price: number
          source: 'manual' | 'auto_check' | 'web_clipper'
          recorded_at: string
        }
        Insert: {
          id?: string
          product_id: string
          price: number
          source?: 'manual' | 'auto_check' | 'web_clipper'
          recorded_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          price?: number
          source?: 'manual' | 'auto_check' | 'web_clipper'
          recorded_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          subcategory_id: string | null
          name: string
          price: number
          link: string
          description: string
          status: 'pending' | 'to_buy' | 'purchased'
          priority: 'low' | 'medium' | 'high'
          image_url: string
          planned_date: string | null
          is_favorite: boolean
          pros: string
          cons: string
          target_price: number | null
          price_alert_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          subcategory_id?: string | null
          name: string
          price?: number
          link?: string
          description?: string
          status?: 'pending' | 'to_buy' | 'purchased'
          priority?: 'low' | 'medium' | 'high'
          image_url?: string
          planned_date?: string | null
          is_favorite?: boolean
          pros?: string
          cons?: string
          target_price?: number | null
          price_alert_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          subcategory_id?: string | null
          name?: string
          price?: number
          link?: string
          description?: string
          status?: 'pending' | 'to_buy' | 'purchased'
          priority?: 'low' | 'medium' | 'high'
          image_url?: string
          planned_date?: string | null
          is_favorite?: boolean
          pros?: string
          cons?: string
          target_price?: number | null
          price_alert_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          user_id: string
          total_budget: number
          currency: string
          dark_mode: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_budget?: number
          currency?: string
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_budget?: number
          currency?: string
          dark_mode?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          user_id: string
          name: string
          budget: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          user_id: string
          name: string
          budget?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          user_id?: string
          name?: string
          budget?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
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
      priority: 'low' | 'medium' | 'high'
      status: 'pending' | 'to_buy' | 'purchased'
      price_source: 'manual' | 'auto_check' | 'web_clipper'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
