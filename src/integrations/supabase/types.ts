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
      calendar_events: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          description: string | null
          end_date_time: string | null
          family_tree_id: string
          id: string
          related_person_id: string | null
          start_date_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          end_date_time?: string | null
          family_tree_id: string
          id?: string
          related_person_id?: string | null
          start_date_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          end_date_time?: string | null
          family_tree_id?: string
          id?: string
          related_person_id?: string | null
          start_date_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_related_person_id_fkey"
            columns: ["related_person_id"]
            isOneToOne: false
            referencedRelation: "tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_trees: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      person_notes: {
        Row: {
          author_user_id: string | null
          content: string
          created_at: string
          id: string
          person_id: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          content: string
          created_at?: string
          id?: string
          person_id: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          content?: string
          created_at?: string
          id?: string
          person_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_notes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_tags: {
        Row: {
          created_at: string
          id: string
          person_id: string
          photo_id: string
          tagged_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          person_id: string
          photo_id: string
          tagged_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          person_id?: string
          photo_id?: string
          tagged_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_tags_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "tree_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_tags_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string
          family_tree_id: string
          id: string
          storage_path: string
          uploaded_by_user_id: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          family_tree_id: string
          id?: string
          storage_path: string
          uploaded_by_user_id?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          family_tree_id?: string
          id?: string
          storage_path?: string
          uploaded_by_user_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_period_end: string | null
          full_name: string | null
          id: string
          plan_type: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_period_end?: string | null
          full_name?: string | null
          id?: string
          plan_type?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_period_end?: string | null
          full_name?: string | null
          id?: string
          plan_type?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      relationships: {
        Row: {
          by_marriage: boolean | null
          created_at: string
          created_by_user_id: string | null
          family_tree_id: string
          from_person_id: string
          id: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          to_person_id: string
          updated_at: string
        }
        Insert: {
          by_marriage?: boolean | null
          created_at?: string
          created_by_user_id?: string | null
          family_tree_id: string
          from_person_id: string
          id?: string
          relationship_type: Database["public"]["Enums"]["relationship_type"]
          to_person_id: string
          updated_at?: string
        }
        Update: {
          by_marriage?: boolean | null
          created_at?: string
          created_by_user_id?: string | null
          family_tree_id?: string
          from_person_id?: string
          id?: string
          relationship_type?: Database["public"]["Enums"]["relationship_type"]
          to_person_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_from_person_id_fkey"
            columns: ["from_person_id"]
            isOneToOne: false
            referencedRelation: "tree_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_person_id_fkey"
            columns: ["to_person_id"]
            isOneToOne: false
            referencedRelation: "tree_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_collaborators: {
        Row: {
          created_at: string
          email: string
          family_tree_id: string
          id: string
          invite_status: Database["public"]["Enums"]["invite_status"]
          invited_by_user_id: string
          role: Database["public"]["Enums"]["collaborator_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          family_tree_id: string
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          invited_by_user_id: string
          role?: Database["public"]["Enums"]["collaborator_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          family_tree_id?: string
          id?: string
          invite_status?: Database["public"]["Enums"]["invite_status"]
          invited_by_user_id?: string
          role?: Database["public"]["Enums"]["collaborator_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_collaborators_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_members: {
        Row: {
          birth_date: string | null
          created_at: string
          created_by_user_id: string | null
          death_date: string | null
          family_tree_id: string
          first_name: string
          gender: string | null
          id: string
          last_name: string | null
          profile_photo_url: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          created_by_user_id?: string | null
          death_date?: string | null
          family_tree_id: string
          first_name: string
          gender?: string | null
          id?: string
          last_name?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          created_by_user_id?: string | null
          death_date?: string | null
          family_tree_id?: string
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string | null
          profile_photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_members_family_tree_id_fkey"
            columns: ["family_tree_id"]
            isOneToOne: false
            referencedRelation: "family_trees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_tree: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
      debug_db_identity: {
        Args: never
        Returns: {
          auth_uid: string
          db_current_user: string
          db_session_user: string
          jwt_role: string
        }[]
      }
      debug_request_context: {
        Args: never
        Returns: {
          auth_uid: string
          jwt_role: string
          jwt_sub: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tree_access: {
        Args: { _tree_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      collaborator_role: "owner" | "editor" | "viewer"
      invite_status: "pending" | "accepted" | "declined"
      relationship_type: "parent" | "child" | "spouse" | "sibling" | "partner"
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
    Enums: {
      app_role: ["admin", "user"],
      collaborator_role: ["owner", "editor", "viewer"],
      invite_status: ["pending", "accepted", "declined"],
      relationship_type: ["parent", "child", "spouse", "sibling", "partner"],
    },
  },
} as const
