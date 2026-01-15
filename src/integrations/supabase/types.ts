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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_stats: {
        Row: {
          accuracy: number
          cards_learned: number
          cards_reviewed: number
          created_at: string
          date: string
          id: string
          pomodoros_completed: number
          study_time: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          cards_learned?: number
          cards_reviewed?: number
          created_at?: string
          date: string
          id?: string
          pomodoros_completed?: number
          study_time?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          cards_learned?: number
          cards_reviewed?: number
          created_at?: string
          date?: string
          id?: string
          pomodoros_completed?: number
          study_time?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      decks: {
        Row: {
          card_count: number
          created_at: string
          description: string | null
          due_count: number
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_count?: number
          created_at?: string
          description?: string | null
          due_count?: number
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_count?: number
          created_at?: string
          description?: string | null
          due_count?: number
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      distraction_logs: {
        Row: {
          description: string | null
          distraction_type: string | null
          duration_seconds: number | null
          id: string
          session_id: string | null
          timestamp: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          description?: string | null
          distraction_type?: string | null
          duration_seconds?: number | null
          id?: string
          session_id?: string | null
          timestamp?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          description?: string | null
          distraction_type?: string | null
          duration_seconds?: number | null
          id?: string
          session_id?: string | null
          timestamp?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distraction_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          card_id: string
          created_at: string
          ease_factor: number
          id: string
          interval: number
          last_reviewed: string | null
          next_review: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval?: number
          last_reviewed?: string | null
          next_review?: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval?: number
          last_reviewed?: string | null
          next_review?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          created_at: string
          deck_id: string
          id: string
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          deck_id: string
          id?: string
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          deck_id?: string
          id?: string
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_minutes: number | null
          created_at: string | null
          ended_at: string | null
          focus_score: number | null
          id: string
          interruptions: number | null
          notes: string | null
          planned_minutes: number
          session_type: string | null
          started_at: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string | null
          ended_at?: string | null
          focus_score?: number | null
          id?: string
          interruptions?: number | null
          notes?: string | null
          planned_minutes: number
          session_type?: string | null
          started_at?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string | null
          ended_at?: string | null
          focus_score?: number | null
          id?: string
          interruptions?: number | null
          notes?: string | null
          planned_minutes?: number
          session_type?: string | null
          started_at?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          position: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          position?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          position?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          backlinks: string[] | null
          body_markdown: string | null
          created_at: string
          folder_id: string | null
          id: string
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backlinks?: string[] | null
          body_markdown?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backlinks?: string[] | null
          body_markdown?: string | null
          created_at?: string
          folder_id?: string | null
          id?: string
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          created_at: string
          duration: number
          id: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration: number
          id?: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration?: number
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_logs: {
        Row: {
          card_id: string
          created_at: string
          deck_id: string
          id: string
          rating: string
          response_time: number
          reviewed_at: string
          user_id: string
          was_correct: boolean
        }
        Insert: {
          card_id: string
          created_at?: string
          deck_id: string
          id?: string
          rating: string
          response_time?: number
          reviewed_at?: string
          user_id: string
          was_correct?: boolean
        }
        Update: {
          card_id?: string
          created_at?: string
          deck_id?: string
          id?: string
          rating?: string
          response_time?: number
          reviewed_at?: string
          user_id?: string
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "review_logs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_logs_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          created_at: string | null
          deck_id: string | null
          description: string | null
          due_at: string | null
          estimate_minutes: number | null
          id: string
          position: number | null
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          created_at?: string | null
          deck_id?: string | null
          description?: string | null
          due_at?: string | null
          estimate_minutes?: number | null
          id?: string
          position?: number | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          created_at?: string | null
          deck_id?: string | null
          description?: string | null
          due_at?: string | null
          estimate_minutes?: number | null
          id?: string
          position?: number | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_study_date: string | null
          longest_streak: number
          total_cards_reviewed: number
          total_study_time: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_study_date?: string | null
          longest_streak?: number
          total_cards_reviewed?: number
          total_study_time?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_study_date?: string | null
          longest_streak?: number
          total_cards_reviewed?: number
          total_study_time?: number
          updated_at?: string
          user_id?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
