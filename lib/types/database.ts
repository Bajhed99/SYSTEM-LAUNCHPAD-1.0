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
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'
          is_founding_member: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'
          is_founding_member?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'
          is_founding_member?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          organization_id: string
          role: 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          organization_id: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          organization_id?: string
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          organization_id: string
          title: string
          meeting_date: string | null
          audio_file_url: string | null
          audio_file_size: number | null
          status: 'pending' | 'processing' | 'transcribed' | 'analyzed' | 'failed'
          metadata: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          meeting_date?: string | null
          audio_file_url?: string | null
          audio_file_size?: number | null
          status?: 'pending' | 'processing' | 'transcribed' | 'analyzed' | 'failed'
          metadata?: Json
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          meeting_date?: string | null
          audio_file_url?: string | null
          audio_file_size?: number | null
          status?: 'pending' | 'processing' | 'transcribed' | 'analyzed' | 'failed'
          metadata?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      transcripts: {
        Row: {
          id: string
          meeting_id: string
          organization_id: string
          raw_text: string
          structured_data: Json
          voxtral_metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          organization_id: string
          raw_text: string
          structured_data?: Json
          voxtral_metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          organization_id?: string
          raw_text?: string
          structured_data?: Json
          voxtral_metadata?: Json
          created_at?: string
        }
      }
      action_items: {
        Row: {
          id: string
          meeting_id: string
          organization_id: string
          transcript_id: string | null
          title: string
          description: string | null
          assignee: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scope_creep_flag: boolean
          ghl_task_id: string | null
          ghl_synced_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meeting_id: string
          organization_id: string
          transcript_id?: string | null
          title: string
          description?: string | null
          assignee?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scope_creep_flag?: boolean
          ghl_task_id?: string | null
          ghl_synced_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meeting_id?: string
          organization_id?: string
          transcript_id?: string | null
          title?: string
          description?: string | null
          assignee?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scope_creep_flag?: boolean
          ghl_task_id?: string | null
          ghl_synced_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      playbook_runs: {
        Row: {
          id: string
          organization_id: string
          meeting_id: string | null
          playbook_type: string
          status: 'pending' | 'running' | 'completed' | 'failed'
          n8n_execution_id: string | null
          payload: Json
          result: Json | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          meeting_id?: string | null
          playbook_type: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          n8n_execution_id?: string | null
          payload?: Json
          result?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          meeting_id?: string | null
          playbook_type?: string
          status?: 'pending' | 'running' | 'completed' | 'failed'
          n8n_execution_id?: string | null
          payload?: Json
          result?: Json | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      crm_connections: {
        Row: {
          id: string
          organization_id: string
          crm_type: 'ghl' | 'hubspot' | 'salesforce'
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          account_id: string | null
          account_name: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          crm_type: 'ghl' | 'hubspot' | 'salesforce'
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          crm_type?: 'ghl' | 'hubspot' | 'salesforce'
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          action_type: string
          resource_type: string
          resource_id: string | null
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          action_type: string
          resource_type: string
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          action_type?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}
