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
      clients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount_cents: number | null
          channel: string | null
          closed_at: string | null
          created_at: string | null
          id: string
          is_recurring: boolean | null
          lead_id: string | null
          owner_id: string | null
          stage: string
        }
        Insert: {
          amount_cents?: number | null
          channel?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          lead_id?: string | null
          owner_id?: string | null
          stage?: string
        }
        Update: {
          amount_cents?: number | null
          channel?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          lead_id?: string | null
          owner_id?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor_id: string | null
          client_id: string | null
          created_at: string | null
          deal_id: string | null
          event_type: string
          id: string
          lead_id: string | null
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          client_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          event_type: string
          id?: string
          lead_id?: string | null
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          client_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          event_type?: string
          id?: string
          lead_id?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_conversations: {
        Row: {
          assigned_to: string | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          contact_avatar: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          external_contact_id: string
          id: string
          last_message: string | null
          last_message_at: string | null
          lead_id: string | null
          origem: Database["public"]["Enums"]["lead_source"] | null
          status: Database["public"]["Enums"]["conversation_status"]
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel_type: Database["public"]["Enums"]["channel_type"]
          contact_avatar?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_contact_id: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          origem?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel_type?: Database["public"]["Enums"]["channel_type"]
          contact_avatar?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_contact_id?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          origem?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["conversation_status"]
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "inbox_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          mensagem: string
          resposta: string | null
          tipo: Database["public"]["Enums"]["channel_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          mensagem: string
          resposta?: string | null
          tipo: Database["public"]["Enums"]["channel_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          mensagem?: string
          resposta?: string | null
          tipo?: Database["public"]["Enums"]["channel_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cargo: string | null
          created_at: string
          criado_via: string | null
          data_abertura: string | null
          email: string | null
          empresa: string | null
          id: string
          localizacao: string | null
          ltv: number | null
          mensagem_enviada: boolean | null
          nome: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["lead_source"]
          proximo_contato: string | null
          responsavel_id: string | null
          reuniao_notas: string | null
          segmento: string | null
          status: Database["public"]["Enums"]["lead_status"]
          telefone: string | null
          ultimo_contato: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          criado_via?: string | null
          data_abertura?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          localizacao?: string | null
          ltv?: number | null
          mensagem_enviada?: boolean | null
          nome: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["lead_source"]
          proximo_contato?: string | null
          responsavel_id?: string | null
          reuniao_notas?: string | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string
          criado_via?: string | null
          data_abertura?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          localizacao?: string | null
          ltv?: number | null
          mensagem_enviada?: boolean | null
          nome?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["lead_source"]
          proximo_contato?: string | null
          responsavel_id?: string | null
          reuniao_notas?: string | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
          ultimo_contato?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      seller_channels: {
        Row: {
          channel_type: Database["public"]["Enums"]["channel_type"]
          config: Json | null
          created_at: string
          id: string
          instance_name: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_type: Database["public"]["Enums"]["channel_type"]
          config?: Json | null
          created_at?: string
          id?: string
          instance_name: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["channel_type"]
          config?: Json | null
          created_at?: string
          id?: string
          instance_name?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          service_type: string
          status: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          service_type?: string
          status?: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          service_type?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          canal: Database["public"]["Enums"]["lead_source"] | null
          categoria: string
          cliente: string | null
          created_at: string
          data: string
          id: string
          observacoes: string | null
          subcategoria: string | null
          tipo: string
          user_id: string | null
          valor: number
        }
        Insert: {
          canal?: Database["public"]["Enums"]["lead_source"] | null
          categoria: string
          cliente?: string | null
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          subcategoria?: string | null
          tipo: string
          user_id?: string | null
          valor: number
        }
        Update: {
          canal?: Database["public"]["Enums"]["lead_source"] | null
          categoria?: string
          cliente?: string | null
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          subcategoria?: string | null
          tipo?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tasks_board: {
        Row: {
          assignee_avatar: string | null
          assignee_email: string | null
          assignee_id: string | null
          assignee_name: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          service_type: string | null
          status: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_calendar: {
        Row: {
          assignee_avatar: string | null
          assignee_id: string | null
          assignee_name: string | null
          client_id: string | null
          client_name: string | null
          due_date: string | null
          id: string | null
          service_type: string | null
          status: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "financeiro"
        | "rh"
        | "social_media"
        | "gestor_trafego"
        | "vendedor"
        | "sdr_outbound"
      channel_type: "whatsapp" | "instagram" | "email" | "ligacao"
      conversation_status: "pendente" | "ativo" | "arquivado"
      lead_source: "inbound" | "outbound" | "indicacao" | "pap" | "trafego_pago"
      lead_status:
        | "novo"
        | "contatado"
        | "respondeu"
        | "reuniao_marcada"
        | "proposta_enviada"
        | "negociacao"
        | "fechado"
        | "perdido"
        | "nutricao"
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
      app_role: [
        "admin",
        "financeiro",
        "rh",
        "social_media",
        "gestor_trafego",
        "vendedor",
        "sdr_outbound",
      ],
      channel_type: ["whatsapp", "instagram", "email", "ligacao"],
      conversation_status: ["pendente", "ativo", "arquivado"],
      lead_source: ["inbound", "outbound", "indicacao", "pap", "trafego_pago"],
      lead_status: [
        "novo",
        "contatado",
        "respondeu",
        "reuniao_marcada",
        "proposta_enviada",
        "negociacao",
        "fechado",
        "perdido",
        "nutricao",
      ],
    },
  },
} as const
