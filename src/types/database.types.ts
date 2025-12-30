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
      exercises: {
        Row: {
          id: string
          name: string
          body_part: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          body_part?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          body_part?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      routine_exercises: {
        Row: {
          id: string
          routine_id: string
          exercise_id: string
          order: number
          target_sets: number | null
          target_reps: number | null
          rest_seconds: number | null
        }
        Insert: {
          id?: string
          routine_id: string
          exercise_id: string
          order: number
          target_sets?: number | null
          target_reps?: number | null
          rest_seconds?: number | null
        }
        Update: {
          id?: string
          routine_id?: string
          exercise_id?: string
          order?: number
          target_sets?: number | null
          target_reps?: number | null
          rest_seconds?: number | null
        }
      }
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          set_number: number
          weight_kg: number | null
          reps: number | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          set_number: number
          weight_kg?: number | null
          reps?: number | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          set_number?: number
          weight_kg?: number | null
          reps?: number | null
          completed_at?: string | null
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          routine_id: string | null
          start_time: string
          end_time: string | null
          status: 'in_progress' | 'completed' | 'cancelled'
        }
        Insert: {
          id?: string
          user_id: string
          routine_id?: string | null
          start_time?: string
          end_time?: string | null
          status?: 'in_progress' | 'completed' | 'cancelled'
        }
        Update: {
          id?: string
          user_id?: string
          routine_id?: string | null
          start_time?: string
          end_time?: string | null
          status?: 'in_progress' | 'completed' | 'cancelled'
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
