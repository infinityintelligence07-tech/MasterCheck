export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          acao: string;
          campo: string | null;
          created_at: string;
          entidade: string | null;
          event_id: string;
          id: string;
          user_id: string | null;
          valor_antigo: string | null;
          valor_novo: string | null;
        };
        Insert: {
          acao: string;
          campo?: string | null;
          created_at?: string;
          entidade?: string | null;
          event_id: string;
          id?: string;
          user_id?: string | null;
          valor_antigo?: string | null;
          valor_novo?: string | null;
        };
        Update: {
          acao?: string;
          campo?: string | null;
          created_at?: string;
          entidade?: string | null;
          event_id?: string;
          id?: string;
          user_id?: string | null;
          valor_antigo?: string | null;
          valor_novo?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_log_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      checklist_items: {
        Row: {
          conferido_em: string | null;
          conferido_por: string | null;
          created_at: string;
          event_id: string;
          http_status: number | null;
          id: string;
          label: string;
          observacao: string | null;
          ordem: number;
          status: Database["public"]["Enums"]["item_status"];
          testado_em: string | null;
          tipo: Database["public"]["Enums"]["checklist_tipo"];
          updated_at: string;
          url: string | null;
          url_versions: Json;
        };
        Insert: {
          conferido_em?: string | null;
          conferido_por?: string | null;
          created_at?: string;
          event_id: string;
          http_status?: number | null;
          id?: string;
          label: string;
          observacao?: string | null;
          ordem?: number;
          status?: Database["public"]["Enums"]["item_status"];
          testado_em?: string | null;
          tipo: Database["public"]["Enums"]["checklist_tipo"];
          updated_at?: string;
          url?: string | null;
          url_versions?: Json;
        };
        Update: {
          conferido_em?: string | null;
          conferido_por?: string | null;
          created_at?: string;
          event_id?: string;
          http_status?: number | null;
          id?: string;
          label?: string;
          observacao?: string | null;
          ordem?: number;
          status?: Database["public"]["Enums"]["item_status"];
          testado_em?: string | null;
          tipo?: Database["public"]["Enums"]["checklist_tipo"];
          updated_at?: string;
          url?: string | null;
          url_versions?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "checklist_items_conferido_por_fkey";
            columns: ["conferido_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checklist_items_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      checklist_templates: {
        Row: {
          created_at: string;
          id: string;
          label: string;
          ordem: number;
          tipo: Database["public"]["Enums"]["checklist_tipo"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          label: string;
          ordem: number;
          tipo: Database["public"]["Enums"]["checklist_tipo"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          label?: string;
          ordem?: number;
          tipo?: Database["public"]["Enums"]["checklist_tipo"];
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          cidade: string;
          created_at: string;
          data_evento: string;
          hora_evento: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          qtd_leads: number;
          qtd_leads_atualizado_em: string | null;
          responsavel_id: string | null;
          status: Database["public"]["Enums"]["event_status"];
          uf: string;
          updated_at: string;
        };
        Insert: {
          cidade: string;
          created_at?: string;
          data_evento: string;
          hora_evento?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          qtd_leads?: number;
          qtd_leads_atualizado_em?: string | null;
          responsavel_id?: string | null;
          status?: Database["public"]["Enums"]["event_status"];
          uf: string;
          updated_at?: string;
        };
        Update: {
          cidade?: string;
          created_at?: string;
          data_evento?: string;
          hora_evento?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          qtd_leads?: number;
          qtd_leads_atualizado_em?: string | null;
          responsavel_id?: string | null;
          status?: Database["public"]["Enums"]["event_status"];
          uf?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_snapshots: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          qtd: number;
          registrado_por: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          qtd: number;
          registrado_por?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          qtd?: number;
          registrado_por?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_snapshots_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_snapshots_registrado_por_fkey";
            columns: ["registrado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          id: string;
          nome: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          id: string;
          nome?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          nome?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_admin: { Args: never; Returns: boolean };
      is_operador_or_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      checklist_tipo:
        | "lp_inscricao"
        | "pagina_obrigado"
        | "grupo_whatsapp"
        | "manychat_inscricao"
        | "manychat_e_amanha"
        | "manychat_e_hoje"
        | "exportacao_leads"
        | "teste_ponta_a_ponta";
      event_status:
        | "rascunho"
        | "em_conferencia"
        | "pronto"
        | "realizado"
        | "cancelado";
      item_status: "pendente" | "ok" | "erro" | "nao_aplica";
      user_role: "admin" | "operador" | "leitor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      checklist_tipo: [
        "lp_inscricao",
        "pagina_obrigado",
        "grupo_whatsapp",
        "manychat_inscricao",
        "manychat_e_amanha",
        "manychat_e_hoje",
        "exportacao_leads",
        "teste_ponta_a_ponta",
      ],
      event_status: [
        "rascunho",
        "em_conferencia",
        "pronto",
        "realizado",
        "cancelado",
      ],
      item_status: ["pendente", "ok", "erro", "nao_aplica"],
      user_role: ["admin", "operador", "leitor"],
    },
  },
} as const;
