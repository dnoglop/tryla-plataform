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
      achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: number
          name: string
          requirement_count: number | null
          requirement_type: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: number
          name: string
          requirement_count?: number | null
          requirement_type: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: number
          name?: string
          requirement_count?: number | null
          requirement_type?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      community_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          id: number
          location: string | null
          time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          id?: number
          location?: string | null
          time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          id?: number
          location?: string | null
          time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          challenge_text: string
          completed: boolean
          created_at: string
          created_date: string
          expires_at: string
          id: string
          related_phase: string | null
          user_id: string
        }
        Insert: {
          challenge_text: string
          completed?: boolean
          created_at?: string
          created_date: string
          expires_at: string
          id?: string
          related_phase?: string | null
          user_id: string
        }
        Update: {
          challenge_text?: string
          completed?: boolean
          created_at?: string
          created_date?: string
          expires_at?: string
          id?: string
          related_phase?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_journals: {
        Row: {
          content: string
          created_at: string | null
          emoji: string | null
          id: string
          is_favorite: boolean | null
          module_id: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_favorite?: boolean | null
          module_id?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_favorite?: boolean | null
          module_id?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_journals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: number
          name: string
          order_index: number
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: number
          name: string
          order_index: number
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: number
          name?: string
          order_index?: number
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      phases: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          icon_type: string | null
          id: number
          module_id: number | null
          name: string
          order_index: number
          type: string | null
          updated_at: string | null
          video_notes: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          icon_type?: string | null
          id?: number
          module_id?: number | null
          name: string
          order_index: number
          type?: string | null
          updated_at?: string | null
          video_notes?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          icon_type?: string | null
          id?: number
          module_id?: number | null
          name?: string
          order_index?: number
          type?: string | null
          updated_at?: string | null
          video_notes?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phases_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          last_login: string | null
          level: number | null
          linkedin_url: string | null
          streak_days: number | null
          updated_at: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          level?: number | null
          linkedin_url?: string | null
          streak_days?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          level?: number | null
          linkedin_url?: string | null
          streak_days?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string | null
          id: number
          options: Json
          order_index: number
          question: string
          quiz_id: number | null
          tips_question: string | null
          updated_at: string | null
        }
        Insert: {
          correct_answer: number
          created_at?: string | null
          id?: number
          options: Json
          order_index: number
          question: string
          quiz_id?: number | null
          tips_question?: string | null
          updated_at?: string | null
        }
        Update: {
          correct_answer?: number
          created_at?: string | null
          id?: number
          options?: Json
          order_index?: number
          question?: string
          quiz_id?: number | null
          tips_question?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          id: number
          phase_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          phase_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          phase_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: true
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: number | null
          id: number
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          achievement_id?: number | null
          id?: number
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievement_id?: number | null
          id?: number
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: number
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: number
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: number
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_phases: {
        Row: {
          completed_at: string | null
          id: string
          phase_id: number
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          phase_id: number
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          phase_id?: number
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_phases_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_history: {
        Row: {
          created_at: string
          id: string
          source: string
          source_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_daily_xp: {
        Args: { user_id_param: string; xp_amount: number }
        Returns: undefined
      }
      complete_phase_and_award_xp_atomic: {
        Args: {
          p_user_id: string
          p_phase_id: number
          p_module_id: number
          p_is_quiz: boolean
        }
        Returns: {
          xp_from_phase: number
          xp_from_module: number
        }[]
      }
      get_user_ranking_by_period: {
        Args: { p_period: string }
        Returns: {
          id: string
          username: string
          full_name: string
          avatar_url: string
          xp: number
          level: number
          rank: number
        }[]
      }
      get_weekly_xp_history: {
        Args: { p_user_id: string }
        Returns: {
          day: string
          total_xp: number
        }[]
      }
      get_weekly_xp_sum: {
        Args: { user_id_param: string }
        Returns: {
          day: string
          total_xp: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
