export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccessRole = 'owner' | 'c_level' | 'team_lead' | 'member'
export type MemberStatus = 'invited' | 'active' | 'removed'
export type TaskStage =
  | 'todo'
  | 'in_progress'
  | 'ready'
  | 'in_review'
  | 'final_review'
  | 'needs_revision'
  | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type TaskSource = 'owner' | 'c_level' | 'team_lead' | 'request' | 'priority_request'
export type RequestStatus = 'pending' | 'accepted' | 'declined'
export type ResultKind = 'document' | 'link' | 'image'
export type PresenceStatus = 'available' | 'focus' | 'meeting' | 'away'
export type ReviewDecision = 'approved' | 'changes_requested'

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string | null
          logo_url: string | null
          email_domain: string | null
          auto_approve_domain: boolean
          task_capacity: number
          brainstorm_default_min: number
          drive_folder_id: string | null
          drive_auto_save: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          logo_url?: string | null
          email_domain?: string | null
          auto_approve_domain?: boolean
          task_capacity?: number
          brainstorm_default_min?: number
          drive_folder_id?: string | null
          drive_auto_save?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          logo_url?: string | null
          email_domain?: string | null
          auto_approve_domain?: boolean
          task_capacity?: number
          brainstorm_default_min?: number
          drive_folder_id?: string | null
          drive_auto_save?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string | null
          avatar_url: string | null
          time_zone: string
          working_hours: Json | null
          locale: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          time_zone?: string
          working_hours?: Json | null
          locale?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          time_zone?: string
          working_hours?: Json | null
          locale?: string
          created_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: AccessRole
          department_id: string | null
          position: string | null
          status: MemberStatus
          invited_by: string | null
          invite_token: string | null
          invite_expires_at: string | null
          last_presence: PresenceStatus | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role: AccessRole
          department_id?: string | null
          position?: string | null
          status?: MemberStatus
          invited_by?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          last_presence?: PresenceStatus | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: AccessRole
          department_id?: string | null
          position?: string | null
          status?: MemberStatus
          invited_by?: string | null
          invite_token?: string | null
          invite_expires_at?: string | null
          last_presence?: PresenceStatus | null
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          workspace_id: string
          name: string
          color: string
          lead_membership_id: string | null
          sort: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          color: string
          lead_membership_id?: string | null
          sort?: number
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          color?: string
          lead_membership_id?: string | null
          sort?: number
          created_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          workspace_id: string
          role: AccessRole
          action: string
          allowed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          role: AccessRole
          action: string
          allowed: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          role?: AccessRole
          action?: string
          allowed?: boolean
          created_at?: string
        }
      }
      join_requests: {
        Row: {
          id: string
          workspace_id: string
          email: string
          full_name: string | null
          note: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          full_name?: string | null
          note?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          full_name?: string | null
          note?: string | null
          status?: string
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          workspace_id: string
          title: string
          description: string | null
          color: string
          label: string
          target_date: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          description?: string | null
          color: string
          label: string
          target_date?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          description?: string | null
          color?: string
          label?: string
          target_date?: string | null
          created_by?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          workspace_id: string
          goal_id: string | null
          department_id: string
          title: string
          description: string | null
          stage: TaskStage
          priority: Priority
          source: TaskSource
          tag: string | null
          assigned_to: string | null
          assigned_by: string | null
          holder_membership_id: string | null
          deadline: string | null
          started_at: string | null
          ready_at: string | null
          sort: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          goal_id?: string | null
          department_id: string
          title: string
          description?: string | null
          stage?: TaskStage
          priority?: Priority
          source?: TaskSource
          tag?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          holder_membership_id?: string | null
          deadline?: string | null
          started_at?: string | null
          ready_at?: string | null
          sort?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          goal_id?: string | null
          department_id?: string
          title?: string
          description?: string | null
          stage?: TaskStage
          priority?: Priority
          source?: TaskSource
          tag?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          holder_membership_id?: string | null
          deadline?: string | null
          started_at?: string | null
          ready_at?: string | null
          sort?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_results: {
        Row: {
          id: string
          task_id: string
          kind: ResultKind
          url: string
          file_name: string | null
          drive_file_id: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          kind: ResultKind
          url: string
          file_name?: string | null
          drive_file_id?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          kind?: ResultKind
          url?: string
          file_name?: string | null
          drive_file_id?: string | null
          uploaded_by?: string
          created_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          task_id: string
          reviewer_id: string
          stage: number
          decision: ReviewDecision | null
          note: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          reviewer_id: string
          stage: number
          decision?: ReviewDecision | null
          note?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          reviewer_id?: string
          stage?: number
          decision?: ReviewDecision | null
          note?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      requests: {
        Row: {
          id: string
          workspace_id: string
          from_membership_id: string
          to_department_id: string
          title: string
          description: string | null
          is_priority: boolean
          status: RequestStatus
          assigned_to: string | null
          decline_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          from_membership_id: string
          to_department_id: string
          title: string
          description?: string | null
          is_priority?: boolean
          status?: RequestStatus
          assigned_to?: string | null
          decline_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          from_membership_id?: string
          to_department_id?: string
          title?: string
          description?: string | null
          is_priority?: boolean
          status?: RequestStatus
          assigned_to?: string | null
          decline_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      kb_documents: {
        Row: {
          id: string
          workspace_id: string
          task_result_id: string | null
          title: string
          content: string | null
          department_id: string | null
          goal_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          task_result_id?: string | null
          title: string
          content?: string | null
          department_id?: string | null
          goal_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          task_result_id?: string | null
          title?: string
          content?: string | null
          department_id?: string | null
          goal_id?: string | null
          created_at?: string
        }
      }
      brainstorm_sessions: {
        Row: {
          id: string
          workspace_id: string
          topic: string
          duration_min: number
          started_at: string | null
          ended_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          topic: string
          duration_min: number
          started_at?: string | null
          ended_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          topic?: string
          duration_min?: number
          started_at?: string | null
          ended_at?: string | null
          created_by?: string
          created_at?: string
        }
      }
      brainstorm_ideas: {
        Row: {
          id: string
          session_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          actor_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          actor_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string | null
          link?: string | null
          actor_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          workspace_id: string
          provider: string
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          provider: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      can: {
        Args: { action_key: string }
        Returns: boolean
      }
      get_user_workspace_role: {
        Args: Record<string, never>
        Returns: AccessRole
      }
      advance_task_stage: {
        Args: { p_task_id: string }
        Returns: Json
      }
      return_task: {
        Args: { p_task_id: string; p_note: string }
        Returns: Json
      }
    }
    Enums: {
      access_role: AccessRole
      member_status: MemberStatus
      task_stage: TaskStage
      priority: Priority
      task_source: TaskSource
      request_status: RequestStatus
      result_kind: ResultKind
      presence_status: PresenceStatus
      review_decision: ReviewDecision
    }
  }
}
