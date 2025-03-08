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
      chatbots: {
        Row: {
          id: string
          name: string
          description?: string | null
          avatar_url?: string | null
          system_prompt: string
          welcome_message?: string | null
          temperature: number
          model: string
          is_active: boolean
          use_rag: boolean
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_url?: string | null
          system_prompt: string
          welcome_message?: string | null
          temperature: number
          model: string
          is_active?: boolean
          use_rag?: boolean
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          system_prompt?: string
          welcome_message?: string | null
          temperature?: number
          model?: string
          is_active?: boolean
          use_rag?: boolean
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number
          price_yearly: number
          features: Json
          max_chatbots: number
          max_team_members: number
          max_documents: number
          max_storage_mb: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_monthly: number
          price_yearly: number
          features: Json
          max_chatbots: number
          max_team_members: number
          max_documents: number
          max_storage_mb: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number
          features?: Json
          max_chatbots?: number
          max_team_members?: number
          max_documents?: number
          max_storage_mb?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          organization_id: string
          plan_id: string
          status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          plan_id: string
          status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          plan_id?: string
          status?: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'past_due'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}